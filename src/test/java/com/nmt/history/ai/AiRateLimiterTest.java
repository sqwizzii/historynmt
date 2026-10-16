package com.nmt.history.ai;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

class AiRateLimiterTest {

    @Test
    void limitsPerUserAndRecoversAfterTheWindow() {
        AiRateLimiter early = new AiRateLimiter(2, Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
        assertTrue(early.tryAcquire("a"));
        assertTrue(early.tryAcquire("a"));
        assertFalse(early.tryAcquire("a"));
        assertTrue(early.tryAcquire("b"));
    }
}
