package com.nmt.history.ai;

import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/** Обмежує кількість нових генерацій на користувача за годину, щоб захистити бюджет API. Лічильник у пам'яті. */
@Component
public class AiRateLimiter {

    private static final long WINDOW_MS = 3_600_000L;

    private final int limit;
    private final Clock clock;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    @Autowired
    public AiRateLimiter(@Value("${app.ai.hourly-limit-per-user:40}") int limit) {
        this(limit, Clock.systemUTC());
    }

    AiRateLimiter(int limit, Clock clock) {
        this.limit = limit;
        this.clock = clock;
    }

    public boolean tryAcquire(String username) {
        long now = clock.millis();
        Deque<Long> queue = hits.computeIfAbsent(username, k -> new ArrayDeque<>());
        synchronized (queue) {
            while (!queue.isEmpty() && now - queue.peekFirst() > WINDOW_MS) {
                queue.pollFirst();
            }
            if (queue.size() >= limit) {
                return false;
            }
            queue.addLast(now);
            return true;
        }
    }
}
