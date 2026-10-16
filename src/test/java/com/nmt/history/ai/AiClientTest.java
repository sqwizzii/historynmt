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
    private volatile String responseBody = "{\"choices\":[{\"message\":{\"content\":\"  Пояснення  \"}}]}";

    @BeforeEach
    void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", exchange -> {
            calls.incrementAndGet();
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
        return new AiClient(new ObjectMapper(), key, "http://127.0.0.1:" + server.getAddress().getPort() + "/v1", "m", 300, 5);
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
}
