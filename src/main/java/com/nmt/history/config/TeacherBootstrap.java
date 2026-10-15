package com.nmt.history.config;

import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Створює початковий акаунт вчителя, якщо його ще немає в БД, лише за явного BOOTSTRAP_TEACHER_ENABLED=true.
 * Вчителі зазвичай реєструються самостійно, тому за замовчуванням акаунт не створюється.
 * Реєстрація через API видає лише роль STUDENT.
 */
@Slf4j
@Component
@Order(1)
public class TeacherBootstrap implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String email;
    private final String password;
    private final boolean enabled;

    public TeacherBootstrap(UserRepository userRepository,
                            PasswordEncoder passwordEncoder,
                            @Value("${app.bootstrap-teacher.username}") String username,
                            @Value("${app.bootstrap-teacher.email}") String email,
                            @Value("${app.bootstrap-teacher.password:}") String password,
                            @Value("${app.bootstrap-teacher.enabled:false}") boolean enabled) {
        this.enabled = enabled;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username;
        this.email = email;
        this.password = password;
    }

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        if (password.length() < 8) {
            throw new IllegalStateException("BOOTSTRAP_TEACHER_PASSWORD має містити щонайменше 8 символів");
        }
        if (userRepository.existsByUsername(username)) {
            return;
        }
        if (userRepository.existsByEmail(email)) {
            log.warn("Акаунт вчителя '{}' не створено: email {} вже використовується", username, email);
            return;
        }
        userRepository.save(User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(Role.TEACHER)
                .build());
        log.info("Створено початковий акаунт вчителя '{}'", username);
    }
}
