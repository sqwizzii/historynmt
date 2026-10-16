package com.nmt.history.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nmt.history.ai.AiResult.Failure;
import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Мінімальний клієнт OpenAI-сумісного Chat Completions API (OpenAI, Groq, Gemini тощо) без додаткових залежностей.
 * Ключ береться лише зі змінної AI_API_KEY; він і заголовок Authorization ніколи не логуються, а повідомлення
 * провайдера очищаються від ключа. Збої не кидають винятків: логується причина, а проходження тестів не залежить від ШІ.
 */
@Slf4j
@Component
public class AiClient {

    private static final int MAX_LOGGED_MESSAGE = 300;

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String endpoint;
    private final String model;
    private final int maxTokens;
    private final String reasoningEffort;
    private final Duration timeout;
    private final HttpClient client;

    public AiClient(ObjectMapper objectMapper,
                    @Value("${app.ai.api-key:}") String apiKey,
                    @Value("${app.ai.base-url:https://api.openai.com/v1}") String baseUrl,
                    @Value("${app.ai.model:gpt-4o-mini}") String model,
                    @Value("${app.ai.max-tokens:1000}") int maxTokens,
                    @Value("${app.ai.timeout-seconds:25}") long timeoutSeconds,
                    @Value("${app.ai.reasoning-effort:}") String reasoningEffort) {
        this.objectMapper = objectMapper;
        this.apiKey = cleanKey(apiKey);
        this.endpoint = endpointOf(baseUrl);
        this.model = model == null ? "" : model.trim();
        this.maxTokens = maxTokens;
        this.reasoningEffort = reasoningEffort == null ? "" : reasoningEffort.trim();
        this.timeout = Duration.ofSeconds(timeoutSeconds);
        this.client = HttpClient.newBuilder().connectTimeout(timeout).build();
    }

    @PostConstruct
    void logConfiguration() {
        if (isConfigured()) {
            log.info("ШІ-пояснення: endpoint={}, model={}, max_tokens={}, reasoning_effort={}, timeout={}s",
                    endpoint, model, maxTokens, reasoningEffort.isEmpty() ? "(не задано)" : reasoningEffort, timeout.toSeconds());
        } else {
            log.info("ШІ-пояснення вимкнено: AI_API_KEY не задано");
        }
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    public String model() {
        return model;
    }

    /** Повний URL запиту; адмін може вказати базу з /chat/completions або без нього, зі слешем чи без. */
    static String endpointOf(String baseUrl) {
        String url = baseUrl == null ? "" : baseUrl.trim();
        while (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        if (url.endsWith("/chat/completions")) {
            url = url.substring(0, url.length() - "/chat/completions".length());
        }
        return url + "/chat/completions";
    }

    private static String cleanKey(String raw) {
        String key = raw == null ? "" : raw.trim();
        if (key.length() > 1 && (key.startsWith("\"") && key.endsWith("\"") || key.startsWith("'") && key.endsWith("'"))) {
            key = key.substring(1, key.length() - 1).trim();
        }
        return key.regionMatches(true, 0, "Bearer ", 0, 7) ? key.substring(7).trim() : key;
    }

    public Optional<String> complete(String system, String user) {
        return Optional.ofNullable(generate(system, user).text());
    }

    public AiResult generate(String system, String user) {
        if (!isConfigured()) {
            return AiResult.failed(Failure.NOT_CONFIGURED, null, null);
        }
        AiResult result = send(system, user);
        if (!result.isOk()) {
            log.warn("ШІ-провайдер: помилка category={} status={} message=\"{}\" endpoint={} model={}. {}",
                    result.failure(), result.status(), result.providerMessage(), endpoint, model, hint(result.failure()));
        }
        return result;
    }

    private AiResult send(String system, String user) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("temperature", 0.2);
            body.put("max_tokens", maxTokens);
            if (!reasoningEffort.isEmpty()) {
                body.put("reasoning_effort", reasoningEffort);
            }
            body.put("messages", List.of(Map.of("role", "system", "content", system), Map.of("role", "user", "content", user)));
            HttpResponse<String> response = client.send(HttpRequest.newBuilder(URI.create(endpoint)).timeout(timeout)
                    .header("Content-Type", "application/json").header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body))).build(),
                    HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();
            if (status != 200) {
                return AiResult.failed(categoryOf(status), status, errorMessage(response.body()));
            }
            return parse(response.body());
        } catch (HttpTimeoutException e) {
            return AiResult.failed(Failure.TIMEOUT, null, "тайм-аут " + timeout.toSeconds() + " с");
        } catch (IllegalArgumentException e) {
            return AiResult.failed(Failure.BAD_REQUEST, null, "некоректна AI_BASE_URL");
        } catch (IOException e) {
            return AiResult.failed(Failure.NETWORK, null, e.getClass().getSimpleName());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return AiResult.failed(Failure.NETWORK, null, "перервано");
        }
    }

    private AiResult parse(String raw) {
        JsonNode root;
        try {
            root = objectMapper.readTree(raw);
        } catch (IOException e) {
            return AiResult.failed(Failure.BAD_RESPONSE, 200, "відповідь не є JSON");
        }
        JsonNode choice = root.path("choices").path(0);
        if (choice.isMissingNode()) {
            return AiResult.failed(Failure.BAD_RESPONSE, 200, "у відповіді немає choices: " + shorten(raw));
        }
        JsonNode content = choice.path("message").path("content");
        String text = content.isTextual() ? content.asText().trim() : "";
        if (!text.isEmpty()) {
            return AiResult.ok(text);
        }
        String finish = choice.path("finish_reason").asText("");
        if ("length".equalsIgnoreCase(finish) || "max_tokens".equalsIgnoreCase(finish)) {
            return AiResult.failed(Failure.TRUNCATED, 200, "порожня відповідь: ліміт токенів вичерпано (finish_reason=" + finish + ")");
        }
        return AiResult.failed(Failure.BAD_RESPONSE, 200, "порожня відповідь (finish_reason=" + finish + ")");
    }

    private static Failure categoryOf(int status) {
        if (status == 401 || status == 403) {
            return Failure.AUTH;
        }
        if (status == 404) {
            return Failure.NOT_FOUND;
        }
        if (status == 429) {
            return Failure.RATE_LIMITED;
        }
        return status >= 500 ? Failure.SERVER_ERROR : Failure.BAD_REQUEST;
    }

    /** Коротке повідомлення провайдера з тіла помилки; формати OpenAI/Gemini: {"error":{"message"}} або [{"error":...}]. */
    private String errorMessage(String raw) {
        try {
            JsonNode root = objectMapper.readTree(raw);
            JsonNode error = root.isArray() ? root.path(0).path("error") : root.path("error");
            String message = error.isTextual() ? error.asText() : error.path("message").asText("");
            return shorten(message.isEmpty() ? raw : message);
        } catch (IOException e) {
            return shorten(raw);
        }
    }

    private String shorten(String value) {
        String text = value == null ? "" : value.replaceAll("\\s+", " ").trim();
        if (!apiKey.isEmpty()) {
            text = text.replace(apiKey, "***");
        }
        return text.length() > MAX_LOGGED_MESSAGE ? text.substring(0, MAX_LOGGED_MESSAGE) + "…" : text;
    }

    private static String hint(Failure failure) {
        return switch (failure) {
            case AUTH -> "Перевірте AI_API_KEY (ключ чинний, API увімкнено для проєкту).";
            case NOT_FOUND -> "Перевірте AI_MODEL (точна назва моделі) і AI_BASE_URL (для Gemini https://generativelanguage.googleapis.com/v1beta/openai).";
            case RATE_LIMITED -> "Вичерпано ліміт безкоштовного рівня провайдера: зачекайте або зменште навантаження.";
            case BAD_REQUEST -> "Провайдер відхилив запит: перевірте AI_MODEL, AI_MAX_TOKENS і AI_REASONING_EFFORT.";
            case SERVER_ERROR -> "Тимчасова помилка на боці провайдера.";
            case TIMEOUT -> "Збільште AI_TIMEOUT_SECONDS або оберіть швидшу модель.";
            case NETWORK -> "Мережева помилка: перевірте AI_BASE_URL і доступ до інтернету.";
            case TRUNCATED -> "Модель витратила ліміт на «мислення»: збільште AI_MAX_TOKENS або задайте AI_REASONING_EFFORT=low.";
            case BAD_RESPONSE -> "Незвичний формат відповіді: перевірте, що AI_BASE_URL OpenAI-сумісна.";
            case NOT_CONFIGURED -> "";
        };
    }
}
