package com.nmt.history.config;

import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Створює окремий акаунт адміністратора з ADMIN_USERNAME / ADMIN_PASSWORD. Роль ADMIN не видається ніде більше
 * (реєстрація створює лише учнів). Пароль береться лише зі змінних середовища й ніколи не логується.
 * Роль наявного користувача змінюється лише за явного ADMIN_PROMOTE_EXISTING=true і лише для учня.
 */
@Slf4j
@Component
@Order(2)
public class AdminBootstrap implements CommandLineRunner {

    static final int MIN_PASSWORD_LENGTH = 12;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String username;
    private final String password;
    private final boolean promoteExisting;

    public AdminBootstrap(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          @Value("${app.admin.username:}") String username,
                          @Value("${app.admin.password:}") String password,
                          @Value("${app.admin.promote-existing:false}") boolean promoteExisting) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.username = username == null ? "" : username.trim();
        this.password = password == null ? "" : password;
        this.promoteExisting = promoteExisting;
    }

    @Override
    public void run(String... args) {
        if (username.isEmpty()) {
            log.info("ADMIN_USERNAME не задано: акаунт адміністратора не створюється");
            return;
        }
        User existing = userRepository.findByUsername(username).orElse(null);
        if (existing == null) {
            create();
        } else if (existing.getRole() == Role.ADMIN) {
            log.info("Акаунт адміністратора '{}' уже існує", username);
        } else if (promoteExisting && existing.getRole() == Role.STUDENT) {
            existing.setRole(Role.ADMIN);
            existing.setTeacherId(null);
            userRepository.save(existing);
            log.warn("Користувача '{}' підвищено до ADMIN за явною вказівкою ADMIN_PROMOTE_EXISTING", username);
        } else {
            log.warn("Користувач '{}' уже існує з роллю {}: роль не змінено. Використайте окремий username для адміністратора.",
                    username, existing.getRole());
        }
    }

    private void create() {
        if (username.length() > 50) {
            throw new IllegalStateException("ADMIN_USERNAME довший за 50 символів");
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("ADMIN_PASSWORD обов'язковий і має містити щонайменше "
                    + MIN_PASSWORD_LENGTH + " символів");
        }
        userRepository.save(User.builder()
                .username(username)
                .password(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .build());
        log.info("Створено акаунт адміністратора '{}'", username);
    }
}
