package com.nmt.history.config;

import com.nmt.history.model.Role;
import com.nmt.history.model.SubscriptionPlan;
import com.nmt.history.model.User;
import com.nmt.history.repository.UserRepository;
import com.nmt.history.service.SubscriptionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Локальні демо-акаунти teacher_demo і student_demo. Працює лише коли паролі задано в локальній конфігурації
 * (app.demo.*, файл config/application.yml поза Git) і ніколи не в профілі prod. Існуючих користувачів не змінює.
 */
@Slf4j
@Component
@Order(4)
public class DemoAccountsSeeder implements CommandLineRunner {

    static final String TEACHER = "teacher_demo";
    static final String STUDENT = "student_demo";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubscriptionService subscriptionService;
    private final Environment environment;
    private final String teacherPassword;
    private final String studentPassword;

    public DemoAccountsSeeder(UserRepository userRepository, PasswordEncoder passwordEncoder,
                              SubscriptionService subscriptionService, Environment environment,
                              @Value("${app.demo.teacher-password:}") String teacherPassword,
                              @Value("${app.demo.student-password:}") String studentPassword) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.subscriptionService = subscriptionService;
        this.environment = environment;
        this.teacherPassword = teacherPassword;
        this.studentPassword = studentPassword;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (teacherPassword.isBlank() && studentPassword.isBlank()) {
            return;
        }
        if (environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))) {
            log.warn("Демо-акаунти ігноруються в профілі prod");
            return;
        }
        User teacher = userRepository.findByUsername(TEACHER).orElse(null);
        if (teacher == null && teacherPassword.length() >= 8) {
            teacher = userRepository.save(User.builder().username(TEACHER).firstName("Демо").lastName("Вчитель")
                    .password(passwordEncoder.encode(teacherPassword)).role(Role.TEACHER).build());
            User admin = userRepository.findByRoleOrderByUsernameAsc(Role.ADMIN).stream().findFirst().orElse(null);
            if (admin != null) {
                subscriptionService.grant(teacher, SubscriptionPlan.YEARLY, admin);
            }
            log.info("Створено демо-акаунт '{}'", TEACHER);
        }
        if (teacher != null && teacher.getRole() == Role.TEACHER && studentPassword.length() >= 8
                && !userRepository.existsByUsername(STUDENT)) {
            userRepository.save(User.builder().username(STUDENT).firstName("Демо").lastName("Учень")
                    .password(passwordEncoder.encode(studentPassword)).role(Role.STUDENT).teacherId(teacher.getId()).build());
            log.info("Створено демо-акаунт '{}'", STUDENT);
        }
    }
}
