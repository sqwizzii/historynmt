package com.nmt.history.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Мінімальний клієнт OpenAI-сумісного Chat Completions API (без додаткових залежностей). Ключ береться лише зі
 * змінної AI_API_KEY і ніколи не логується; без ключа інтеграція вимкнена. Помилки й тайм-аути не кидають винятків:
 * повертається порожній результат, а проходження тестів і підрахунок балів не залежать від ШІ.
 */
@Slf4j
@Component
public class AiClient {

    private final ObjectMapper objectMapper;
    private final String apiKey;
    private final String baseUrl;
    private final String model;
    private final int maxTokens;
    private final Duration timeout;
    private final HttpClient client;

    public AiClient(ObjectMapper objectMapper,
                    @Value("${app.ai.api-key:}") String apiKey,
                    @Value("${app.ai.base-url:https://api.openai.com/v1}") String baseUrl,
                    @Value("${app.ai.model:gpt-4o-mini}") String model,
                    @Value("${app.ai.max-tokens:300}") int maxTokens,
                    @Value("${app.ai.timeout-seconds:15}") long timeoutSeconds) {
        this.objectMapper = objectMapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.model = model;
        this.maxTokens = maxTokens;
        this.timeout = Duration.ofSeconds(timeoutSeconds);
        this.client = HttpClient.newBuilder().connectTimeout(timeout).build();
    }

    public boolean isConfigured() {
        return !apiKey.isEmpty();
    }

    public String model() {
        return model;
    }

    public Optional<String> complete(String system, String user) {
        if (!isConfigured()) {
            return Optional.empty();
        }
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "model", model, "temperature", 0.2, "max_tokens", maxTokens,
                    "messages", List.of(Map.of("role", "system", "content", system), Map.of("role", "user", "content", user))));
            HttpResponse<String> response = client.send(HttpRequest.newBuilder(URI.create(baseUrl + "/chat/completions"))
                    .timeout(timeout).header("Content-Type", "application/json").header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("AI API повернув статус {}", response.statusCode());
                return Optional.empty();
            }
            JsonNode content = objectMapper.readTree(response.body()).path("choices").path(0).path("message").path("content");
            String text = content.isTextual() ? content.asText().trim() : "";
            return text.isEmpty() ? Optional.empty() : Optional.of(text);
        } catch (IOException e) {
            log.warn("AI API недоступний: {}", e.getClass().getSimpleName());
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }
}
