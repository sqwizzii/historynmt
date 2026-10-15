package com.nmt.history.config;

import com.nmt.history.model.AppSetting;
import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.AppSettingRepository;
import com.nmt.history.repository.QuizletModuleRepository;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Одноразово передає матеріали та учнів, створені до запровадження власності, вчителю з LEGACY_TEACHER_USERNAME.
 *
 * <p>Нічого не вгадується: власник береться лише з явної конфігурації, користувач має існувати й бути TEACHER.
 * Якщо вчителів кілька, учні прив'язуються лише за LEGACY_ASSIGN_ALL_STUDENTS=true. За недостатньої
 * конфігурації production (LEGACY_STRICT) не стартує й виводить діагностичний список, інакше лише попереджає.
 * Після виконання (або якщо переносити нічого) в app_settings ставиться позначка, і крок більше не запускається,
 * тож пізніші системні матеріали адміністратора ніколи не передаються вчителю.
 */
@Slf4j
@Component
@Order(3)
public class LegacyOwnershipInitializer implements CommandLineRunner {

    static final String DONE_KEY = "legacy_ownership_done";

    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final QuizletModuleRepository moduleRepository;
    private final AppSettingRepository settingRepository;
    private final TransactionTemplate transaction;
    private final String teacherUsername;
    private final boolean assignAllStudents;
    private final boolean strict;

    public LegacyOwnershipInitializer(UserRepository userRepository,
                                      TestRepository testRepository,
                                      QuizletModuleRepository moduleRepository,
                                      AppSettingRepository settingRepository,
                                      TransactionTemplate transaction,
                                      @Value("${app.legacy.teacher-username:}") String teacherUsername,
                                      @Value("${app.legacy.assign-all-students:false}") boolean assignAllStudents,
                                      @Value("${app.legacy.strict:false}") boolean strict) {
        this.userRepository = userRepository;
        this.testRepository = testRepository;
        this.moduleRepository = moduleRepository;
        this.settingRepository = settingRepository;
        this.transaction = transaction;
        this.teacherUsername = teacherUsername == null ? "" : teacherUsername.trim();
        this.assignAllStudents = assignAllStudents;
        this.strict = strict;
    }

    @Override
    public void run(String... args) {
        if (settingRepository.existsById(DONE_KEY)) {
            return;
        }
        long tests = testRepository.countByOwnerIsNull();
        long modules = moduleRepository.countByOwnerIsNull();
        List<User> students = userRepository.findByRoleAndTeacherIdIsNull(Role.STUDENT);
        if (tests + modules + students.size() == 0) {
            settingRepository.save(new AppSetting(DONE_KEY, "nothing-to-assign at " + LocalDateTime.now()));
            return;
        }

        List<User> teachers = userRepository.findByRoleOrderByUsernameAsc(Role.TEACHER);
        String problem = validate(teachers, students.size());
        if (problem != null) {
            String message = problem + System.lineSeparator() + diagnostics(teachers, tests, modules, students.size());
            if (strict) {
                throw new IllegalStateException(message);
            }
            log.warn("Власників старих даних не призначено. {}", message);
            return;
        }

        User teacher = userRepository.findByUsername(teacherUsername).orElseThrow();
        transaction.executeWithoutResult(status -> {
            int assignedTests = testRepository.assignOwnerToUnowned(teacher);
            int assignedModules = moduleRepository.assignOwnerToUnowned(teacher);
            teacher.setLegacyFreeAccess(true);
            userRepository.save(teacher);
            for (User student : students) {
                student.setTeacherId(teacher.getId());
                student.setLegacyFreeAccess(true);
            }
            userRepository.saveAll(students);
            settingRepository.save(new AppSetting(DONE_KEY, "teacher=" + teacherUsername + " at " + LocalDateTime.now()));
            log.info("Передано вчителю '{}': тестів {}, модулів {}, учнів {}", teacherUsername, assignedTests,
                    assignedModules, students.size());
        });
    }

    private String validate(List<User> teachers, int unassignedStudents) {
        if (teacherUsername.isEmpty()) {
            return "LEGACY_TEACHER_USERNAME не задано, а в БД є матеріали чи учні без власника.";
        }
        boolean isTeacher = teachers.stream().anyMatch(t -> t.getUsername().equals(teacherUsername));
        if (!isTeacher) {
            return "LEGACY_TEACHER_USERNAME='" + teacherUsername + "' не існує або не має ролі TEACHER.";
        }
        if (unassignedStudents > 0 && teachers.size() > 1 && !assignAllStudents) {
            return "У БД кілька вчителів, тому неможливо достовірно визначити вчителя для " + unassignedStudents
                    + " неприв'язаних учнів. Підтвердіть явно: LEGACY_ASSIGN_ALL_STUDENTS=true.";
        }
        return null;
    }

    private String diagnostics(List<User> teachers, long tests, long modules, int students) {
        StringBuilder sb = new StringBuilder("Діагностика: вчителі в БД: ");
        sb.append(teachers.isEmpty() ? "немає" : String.join(", ", teachers.stream().map(User::getUsername).toList()));
        sb.append("; матеріали без власника: тестів ").append(tests).append(", модулів ").append(modules);
        sb.append("; неприв'язаних учнів: ").append(students).append('.');
        return sb.toString();
    }
}
