package com.nmt.history;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nmt.history.config.AdminBootstrap;
import com.nmt.history.config.LegacyOwnershipInitializer;
import com.nmt.history.model.QuizletModule;
import com.nmt.history.model.Role;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.AppSettingRepository;
import com.nmt.history.repository.QuizletModuleRepository;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import jakarta.persistence.EntityManager;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Перевіряє одноразове призначення власників старих даних і створення адміністратора.
 * Кожен тест виконується в транзакції, яка відкочується, тож спільна тестова БД не змінюється.
 */
@Transactional
class LegacyOwnershipInitializerTest extends AbstractApiTest {

    private static final String MARKER = "legacy_ownership_done";

    @Autowired
    private UserRepository users;
    @Autowired
    private TestRepository tests;
    @Autowired
    private QuizletModuleRepository modules;
    @Autowired
    private TestResultRepository results;
    @Autowired
    private AppSettingRepository settings;
    @Autowired
    private TransactionTemplate transaction;
    @Autowired
    private PasswordEncoder encoder;
    @Autowired
    private EntityManager em;

    private User legacyTeacher;
    private User student;
    private com.nmt.history.model.Test legacyTest;
    private QuizletModule legacyModule;
    private TestResult legacyResult;

    @BeforeEach
    void legacyData() {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        settings.deleteById(MARKER);
        users.findByRoleAndTeacherIdIsNull(Role.STUDENT).forEach(u -> u.setTeacherId(-1L));
        User parking = users.save(User.builder().username("parking_" + suffix).password("x").role(Role.ADMIN).build());
        tests.assignOwnerToUnowned(parking);
        modules.assignOwnerToUnowned(parking);
        em.flush();
        em.clear();

        legacyTeacher = users.save(User.builder().username("legacy_t_" + suffix).password("x").role(Role.TEACHER).build());
        student = users.save(User.builder().username("legacy_s_" + suffix).password("x").role(Role.STUDENT).build());
        legacyTest = tests.save(com.nmt.history.model.Test.builder().title("Старий тест").build());
        legacyModule = modules.save(QuizletModule.builder().title("Старий модуль").build());
        legacyResult = results.save(TestResult.builder().student(student).test(legacyTest).score(17).nmtScore(187).build());
        em.flush();
    }

    private LegacyOwnershipInitializer initializer(String username, boolean assignAll, boolean strict) {
        return new LegacyOwnershipInitializer(users, tests, modules, settings, transaction, username, assignAll, strict);
    }

    private void reload() {
        em.flush();
        em.clear();
    }

    @Test
    void assignsEverythingToTheConfiguredTeacherAndPreservesResults() {
        initializer(legacyTeacher.getUsername(), true, true).run();
        reload();

        assertEquals(legacyTeacher.getId(), tests.findById(legacyTest.getId()).orElseThrow().getOwner().getId());
        assertEquals(legacyTeacher.getId(), modules.findAll().stream()
                .filter(m -> m.getId().equals(legacyModule.getId())).findFirst().orElseThrow().getOwner().getId());
        User reloaded = users.findById(student.getId()).orElseThrow();
        assertEquals(legacyTeacher.getId(), reloaded.getTeacherId());
        assertTrue(reloaded.isLegacyFreeAccess());
        assertTrue(users.findById(legacyTeacher.getId()).orElseThrow().isLegacyFreeAccess());
        assertTrue(settings.existsById(MARKER));

        TestResult result = results.findById(legacyResult.getId()).orElseThrow();
        assertEquals(17, result.getScore());
        assertEquals(187, result.getNmtScore());
        assertEquals(student.getId(), result.getStudent().getId());
        assertEquals(legacyTest.getId(), result.getTest().getId());
    }

    @Test
    void doesNotRunAgainSoLaterSystemMaterialsStaySystem() {
        initializer(legacyTeacher.getUsername(), true, true).run();
        com.nmt.history.model.Test later = tests.save(com.nmt.history.model.Test.builder().title("Новий системний").build());
        reload();

        initializer(legacyTeacher.getUsername(), true, true).run();
        reload();
        assertNull(tests.findById(later.getId()).orElseThrow().getOwner());
    }

    @Test
    void strictModeRefusesToStartWithoutExplicitTeacherAndPrintsDiagnostics() {
        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> initializer("", false, true).run());
        assertTrue(error.getMessage().contains("LEGACY_TEACHER_USERNAME не задано"));
        assertTrue(error.getMessage().contains(legacyTeacher.getUsername()), "діагностика містить список вчителів");
        assertTrue(error.getMessage().contains("тестів 1"));
        assertFalse(settings.existsById(MARKER));
        reload();
        assertNull(tests.findById(legacyTest.getId()).orElseThrow().getOwner());
        assertNull(users.findById(student.getId()).orElseThrow().getTeacherId());
    }

    @Test
    void strictModeRefusesAnUnknownOrNonTeacherUsername() {
        assertThrows(IllegalStateException.class, () -> initializer("no_such_user_" + UUID.randomUUID(), true, true).run());
        IllegalStateException notTeacher = assertThrows(IllegalStateException.class,
                () -> initializer(student.getUsername(), true, true).run());
        assertTrue(notTeacher.getMessage().contains("не має ролі TEACHER"));
        assertFalse(settings.existsById(MARKER));
    }

    @Test
    void severalTeachersRequireExplicitConfirmationForStudents() {
        users.save(User.builder().username("legacy_t2_" + UUID.randomUUID().toString().substring(0, 8))
                .password("x").role(Role.TEACHER).build());
        em.flush();

        IllegalStateException error = assertThrows(IllegalStateException.class,
                () -> initializer(legacyTeacher.getUsername(), false, true).run());
        assertTrue(error.getMessage().contains("LEGACY_ASSIGN_ALL_STUDENTS=true"));
        reload();
        assertNull(users.findById(student.getId()).orElseThrow().getTeacherId());
        assertNull(tests.findById(legacyTest.getId()).orElseThrow().getOwner());
        assertFalse(settings.existsById(MARKER));

        initializer(legacyTeacher.getUsername(), true, true).run();
        reload();
        assertEquals(legacyTeacher.getId(), users.findById(student.getId()).orElseThrow().getTeacherId());
    }

    @Test
    void nonStrictModeOnlyWarnsAndChangesNothing() {
        initializer("", false, false).run();
        reload();
        assertNull(tests.findById(legacyTest.getId()).orElseThrow().getOwner());
        assertNull(users.findById(student.getId()).orElseThrow().getTeacherId());
        assertFalse(settings.existsById(MARKER));
    }

    @Test
    void marksDoneWhenThereIsNothingToAssign() {
        tests.assignOwnerToUnowned(legacyTeacher);
        modules.assignOwnerToUnowned(legacyTeacher);
        users.findById(student.getId()).orElseThrow().setTeacherId(legacyTeacher.getId());
        em.flush();

        initializer("", false, true).run();
        assertTrue(settings.existsById(MARKER));
    }

    @Test
    void adminIsCreatedOnceWithoutTouchingExistingUsers() {
        String name = "adm_" + UUID.randomUUID().toString().substring(0, 8);
        new AdminBootstrap(users, encoder, name, "A-long-secret-123", false).run();
        User admin = users.findByUsername(name).orElseThrow();
        assertEquals(Role.ADMIN, admin.getRole());
        assertTrue(encoder.matches("A-long-secret-123", admin.getPassword()));
        assertNotNull(admin.getId());

        new AdminBootstrap(users, encoder, name, "another-secret-456", false).run();
        assertTrue(encoder.matches("A-long-secret-123", users.findByUsername(name).orElseThrow().getPassword()),
                "повторний запуск не змінює пароль наявного адміністратора");
    }

    @Test
    void adminBootstrapNeverChangesTheRoleOfAnExistingUserWithoutExplicitInstruction() {
        new AdminBootstrap(users, encoder, legacyTeacher.getUsername(), "A-long-secret-123", false).run();
        assertEquals(Role.TEACHER, users.findById(legacyTeacher.getId()).orElseThrow().getRole());

        new AdminBootstrap(users, encoder, student.getUsername(), "A-long-secret-123", false).run();
        assertEquals(Role.STUDENT, users.findById(student.getId()).orElseThrow().getRole());

        new AdminBootstrap(users, encoder, legacyTeacher.getUsername(), "A-long-secret-123", true).run();
        assertEquals(Role.TEACHER, users.findById(legacyTeacher.getId()).orElseThrow().getRole(),
                "навіть із прапорцем вчителя не підвищують");

        new AdminBootstrap(users, encoder, student.getUsername(), "A-long-secret-123", true).run();
        assertEquals(Role.ADMIN, users.findById(student.getId()).orElseThrow().getRole());
    }

    @Test
    void adminBootstrapRejectsAWeakOrMissingPasswordAndSkipsWithoutUsername() {
        String name = "adm_weak_" + UUID.randomUUID().toString().substring(0, 6);
        assertThrows(IllegalStateException.class, () -> new AdminBootstrap(users, encoder, name, "short", false).run());
        assertThrows(IllegalStateException.class, () -> new AdminBootstrap(users, encoder, name, "", false).run());
        assertFalse(users.existsByUsername(name));

        long before = users.count();
        new AdminBootstrap(users, encoder, "", "", false).run();
        assertEquals(before, users.count());
    }
}
