package com.nmt.history.service;

import com.nmt.history.exception.TooManyRequestsException;
import com.nmt.history.model.LoginFailure;
import com.nmt.history.repository.LoginFailureRepository;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/** Обмежує підбір пароля: після кількох невдалих спроб вхід для username тимчасово блокується. Стан зберігається в БД. */
@Service
public class LoginAttemptService {

    private final LoginFailureRepository repository;
    private final int maxFailures;
    private final Duration window;

    public LoginAttemptService(LoginFailureRepository repository,
                               @Value("${app.login.max-failures}") int maxFailures,
                               @Value("${app.login.window-minutes}") long windowMinutes) {
        this.repository = repository;
        this.maxFailures = maxFailures;
        this.window = Duration.ofMinutes(windowMinutes);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
    public void assertNotBlocked(String username) {
        long recent = repository.countByUsernameAndAttemptedAtAfter(key(username), LocalDateTime.now().minus(window));
        if (recent >= maxFailures) {
            throw new TooManyRequestsException(
                    "Забагато невдалих спроб входу. Спробуйте через " + window.toMinutes() + " хв.");
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(String username) {
        LocalDateTime now = LocalDateTime.now();
        repository.deleteByAttemptedAtBefore(now.minus(window));
        repository.save(LoginFailure.builder().username(key(username)).attemptedAt(now).build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void reset(String username) {
        repository.deleteByUsername(key(username));
    }

    private String key(String username) {
        String normalized = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
        return normalized.length() > 100 ? normalized.substring(0, 100) : normalized;
    }
}
