package com.nmt.history.service;

import com.nmt.history.exception.TooManyRequestsException;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/** Обмежує підбір пароля: після кількох невдалих спроб вхід для username тимчасово блокується. */
@Service
public class LoginAttemptService {

    private static final int CLEANUP_THRESHOLD = 10_000;

    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();
    private final int maxFailures;
    private final Duration window;

    public LoginAttemptService(@Value("${app.login.max-failures}") int maxFailures,
                               @Value("${app.login.window-minutes}") long windowMinutes) {
        this.maxFailures = maxFailures;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    public void assertNotBlocked(String username) {
        Deque<Instant> attempts = failures.get(key(username));
        if (attempts == null) {
            return;
        }
        synchronized (attempts) {
            prune(attempts);
            if (attempts.size() >= maxFailures) {
                throw new TooManyRequestsException(
                        "Забагато невдалих спроб входу. Спробуйте через " + window.toMinutes() + " хв.");
            }
        }
    }

    public void recordFailure(String username) {
        if (failures.size() > CLEANUP_THRESHOLD) {
            failures.values().removeIf(deque -> {
                synchronized (deque) {
                    prune(deque);
                    return deque.isEmpty();
                }
            });
        }
        Deque<Instant> attempts = failures.computeIfAbsent(key(username), k -> new ArrayDeque<>());
        synchronized (attempts) {
            prune(attempts);
            attempts.addLast(Instant.now());
        }
    }

    public void reset(String username) {
        failures.remove(key(username));
    }

    private void prune(Deque<Instant> attempts) {
        Instant threshold = Instant.now().minus(window);
        while (!attempts.isEmpty() && attempts.peekFirst().isBefore(threshold)) {
            attempts.removeFirst();
        }
    }

    private String key(String username) {
        return username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    }
}
