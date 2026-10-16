package com.nmt.history.ai;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AiClientTest {

    private HttpServer server;
    private final AtomicInteger calls = new AtomicInteger();
    private final AtomicReference<String> auth = new AtomicReference<>();
    private final AtomicReference<String> requestBody = new AtomicReference<>();
    private volatile int status = 200;
    private volatile long delayMs = 0;
    private volatile String responseBody = "{\"choices\":[{\"message\":{\"content\":\"  Пояснення  \"}}]}";

    @BeforeEach
    void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", exchange -> {
            calls.incrementAndGet();
            if (delayMs > 0) {
                try {
                    Thread.sleep(delayMs);
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                }
            }
            auth.set(exchange.getRequestHeaders().getFirst("Authorization"));
            requestBody.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] bytes = responseBody.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, bytes.length);
            exchange.getResponseBody().write(bytes);
            exchange.close();
        });
        server.start();
    }

    @AfterEach
    void stop() {
        server.stop(0);
    }

    private AiClient client(String key) {
        return new AiClient(new ObjectMapper(), key, "http://127.0.0.1:" + server.getAddress().getPort() + "/v1", "m", 300, 5, "");
    }

    @Test
    void returnsTrimmedTextAndSendsKeyOnlyAsBearerHeader() {
        AiClient client = client("test-key-123");
        assertTrue(client.isConfigured());
        assertEquals("Пояснення", client.complete("sys", "user").orElseThrow());
        assertEquals("Bearer test-key-123", auth.get());
        assertFalse(requestBody.get().contains("test-key-123"));
        assertTrue(requestBody.get().contains("\"max_tokens\":300"));
    }

    @Test
    void failuresAndMissingKeyNeverThrowAndMissingKeyMakesNoRequest() {
        status = 500;
        assertTrue(client("k").complete("s", "u").isEmpty());
        status = 200;
        responseBody = "not json";
        assertTrue(client("k").complete("s", "u").isEmpty());
        responseBody = "{\"choices\":[]}";
        assertTrue(client("k").complete("s", "u").isEmpty());
        int before = calls.get();
        AiClient unconfigured = client("  ");
        assertFalse(unconfigured.isConfigured());
        assertTrue(unconfigured.complete("s", "u").isEmpty());
        assertEquals(before, calls.get());
    }

    @Test
    void unreachableServerGivesEmptyResult() {
        server.stop(0);
        assertTrue(client("k").complete("s", "u").isEmpty());
    }

    private AiClient clientWith(String key, String effort, long timeoutSeconds) {
        return new AiClient(new ObjectMapper(), key, "http://127.0.0.1:" + server.getAddress().getPort() + "/v1/", "gemini-x", 800, timeoutSeconds, effort);
    }

    @Test
    void classifiesProviderErrorsAndExtractsTheirMessageWithoutTheKey() {
        record Case(int status, String body, AiResult.Failure expected) { }
        for (Case c : new Case[] {
                new Case(401, "{\"error\":{\"message\":\"API key not valid: secret-key-xyz\"}}", AiResult.Failure.AUTH),
                new Case(403, "[{\"error\":{\"code\":403,\"message\":\"Permission denied\"}}]", AiResult.Failure.AUTH),
                new Case(404, "{\"error\":{\"message\":\"models/x is not found\"}}", AiResult.Failure.NOT_FOUND),
                new Case(429, "{\"error\":{\"message\":\"Quota exceeded\"}}", AiResult.Failure.RATE_LIMITED),
                new Case(400, "{\"error\":{\"message\":\"Unknown field reasoning_effort\"}}", AiResult.Failure.BAD_REQUEST),
                new Case(503, "Service Unavailable", AiResult.Failure.SERVER_ERROR)}) {
            status = c.status();
            responseBody = c.body();
            AiResult result = clientWith("secret-key-xyz", "", 5).generate("s", "u");
            assertFalse(result.isOk());
            assertEquals(c.expected(), result.failure(), "status " + c.status());
            assertEquals(c.status(), result.status());
            assertFalse(result.providerMessage().contains("secret-key-xyz"), "ключ не має потрапляти у діагностику");
        }
        status = 401;
        responseBody = "{\"error\":{\"message\":\"API key not valid: secret-key-xyz\"}}";
        assertEquals("API key not valid: ***", clientWith("secret-key-xyz", "", 5).generate("s", "u").providerMessage());
    }

    @Test
    void classifiesFormatTruncationAndTimeoutProblems() {
        responseBody = "not json";
        assertEquals(AiResult.Failure.BAD_RESPONSE, clientWith("k", "", 5).generate("s", "u").failure());
        responseBody = "{\"choices\":[]}";
        assertEquals(AiResult.Failure.BAD_RESPONSE, clientWith("k", "", 5).generate("s", "u").failure());
        responseBody = "{\"choices\":[{\"finish_reason\":\"length\",\"message\":{\"content\":null}}]}";
        AiResult truncated = clientWith("k", "", 5).generate("s", "u");
        assertEquals(AiResult.Failure.TRUNCATED, truncated.failure());
        assertTrue(truncated.providerMessage().contains("length"));
        responseBody = "{\"choices\":[{\"finish_reason\":\"stop\",\"message\":{\"content\":\"   \"}}]}";
        assertEquals(AiResult.Failure.BAD_RESPONSE, clientWith("k", "", 5).generate("s", "u").failure());

        responseBody = "{\"choices\":[{\"message\":{\"content\":\"ok\"}}]}";
        delayMs = 2500;
        assertEquals(AiResult.Failure.TIMEOUT, clientWith("k", "", 1).generate("s", "u").failure());
    }

    @Test
    void sendsReasoningEffortOnlyWhenConfiguredAndNormalizesTheBaseUrl() {
        clientWith("k", "low", 5).generate("s", "u");
        assertTrue(requestBody.get().contains("\"reasoning_effort\":\"low\""));
        assertTrue(requestBody.get().contains("\"model\":\"gemini-x\""));
        assertTrue(requestBody.get().contains("\"max_tokens\":800"));
        clientWith("k", "", 5).generate("s", "u");
        assertFalse(requestBody.get().contains("reasoning_effort"));

        assertEquals("https://h/v1/chat/completions", AiClient.endpointOf("https://h/v1"));
        assertEquals("https://h/v1/chat/completions", AiClient.endpointOf("https://h/v1/"));
        assertEquals("https://h/v1/chat/completions", AiClient.endpointOf("https://h/v1/chat/completions"));
        assertEquals("https://h/v1beta/openai/chat/completions", AiClient.endpointOf(" https://h/v1beta/openai/ "));
    }

    @Test
    void toleratesQuotedKeysAndBearerPrefix() {
        clientWith("\"Bearer quoted-key\"", "", 5).generate("s", "u");
        assertEquals("Bearer quoted-key", auth.get());
    }
}
