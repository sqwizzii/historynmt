package com.nmt.history.service;

import com.nmt.history.dto.AdminDtos.AdminSubject;
import com.nmt.history.dto.AdminDtos.AdminUser;
import com.nmt.history.dto.AdminDtos.Page;
import com.nmt.history.dto.AdminDtos.Stats;
import com.nmt.history.dto.AdminDtos.SubjectRequest;
import com.nmt.history.dto.SubscriptionStatusResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ConflictException;
import com.nmt.history.exception.ForbiddenException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Role;
import com.nmt.history.model.Subject;
import com.nmt.history.model.SubscriptionPlan;
import com.nmt.history.model.SubscriptionStatus;
import com.nmt.history.model.User;
import com.nmt.history.repository.PracticeFixRepository;
import com.nmt.history.repository.QuizletModuleRepository;
import com.nmt.history.repository.SubjectRepository;
import com.nmt.history.repository.SubscriptionRepository;
import com.nmt.history.repository.TestAssignmentRepository;
import com.nmt.history.repository.TestAttemptRepository;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Адміністрування платформи. Кожен виклик повторно перевіряє роль ADMIN на сервері. */
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final TestRepository testRepository;
    private final QuizletModuleRepository moduleRepository;
    private final SubjectRepository subjectRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final SubscriptionService subscriptionService;
    private final TestResultRepository resultRepository;
    private final TestAttemptRepository attemptRepository;
    private final PracticeFixRepository practiceFixRepository;
    private final TestAssignmentRepository assignmentRepository;
    private final AccessPolicy accessPolicy;

    private User admin(String username) {
        User actor = accessPolicy.requireActor(username);
        if (actor.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Дія доступна лише адміністратору");
        }
        return actor;
    }

    @Transactional(readOnly = true)
    public Stats stats(String username) {
        admin(username);
        return new Stats(userRepository.count(), userRepository.countByRole(Role.ADMIN),
                userRepository.countByRole(Role.TEACHER), userRepository.countByRole(Role.STUDENT),
                testRepository.count(), testRepository.countByOwnerIsNull(),
                moduleRepository.count(), moduleRepository.countByOwnerIsNull(), subjectRepository.count(),
                subscriptionRepository.countByStatusAndExpiresAtAfter(SubscriptionStatus.ACTIVE, LocalDateTime.now()),
                resultRepository.count());
    }

    @Transactional(readOnly = true)
    public Page<AdminUser> users(String username, String query, Role role, int page, int size) {
        admin(username);
        var roles = role == null ? EnumSet.allOf(Role.class) : EnumSet.of(role);
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        var result = userRepository.search(roles, q, PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        return new Page<>(result.getContent().stream().map(this::toAdminUser).toList(), result.getTotalElements(),
                result.getNumber(), result.getSize());
    }

    private AdminUser toAdminUser(User user) {
        SubscriptionStatusResponse subscription = user.getRole() == Role.TEACHER ? subscriptionService.status(user) : null;
        return new AdminUser(user.getId(), user.getUsername(), user.getFullName(), user.getEmail(), user.getRole(),
                user.getTeacherId(), subscription);
    }

    @Transactional
    public AdminUser changeRole(String username, Long userId, Role role) {
        User actor = admin(username);
        User target = findUser(userId);
        if (target.getId().equals(actor.getId())) {
            throw new ForbiddenException("Не можна змінювати власну роль");
        }
        if (target.getRole() == role) {
            return toAdminUser(target);
        }
        if (target.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ConflictException("Не можна позбавити ролі останнього адміністратора");
        }
        if (target.getRole() == Role.TEACHER && hasTeacherData(target)) {
            throw new ConflictException("У вчителя є тести, модулі або учні: спочатку видаліть або перенесіть їх");
        }
        if (role != Role.STUDENT) {
            target.setTeacherId(null);
        }
        target.setRole(role);
        return toAdminUser(userRepository.save(target));
    }

    @Transactional
    public void deleteUser(String username, Long userId) {
        User actor = admin(username);
        User target = findUser(userId);
        if (target.getId().equals(actor.getId())) {
            throw new ForbiddenException("Не можна видалити власний акаунт");
        }
        if (target.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1) {
            throw new ConflictException("Не можна видалити останнього адміністратора");
        }
        if (target.getRole() == Role.TEACHER && hasTeacherData(target)) {
            throw new ConflictException("У вчителя є тести, модулі або учні: спочатку видаліть або перенесіть їх");
        }
        resultRepository.deleteByStudentId(userId);
        attemptRepository.deleteByStudentId(userId);
        practiceFixRepository.deleteByStudentId(userId);
        assignmentRepository.deleteByStudentId(userId);
        subscriptionRepository.deleteByUserId(userId);
        subscriptionRepository.clearCreator(userId);
        userRepository.delete(target);
    }

    @Transactional
    public AdminUser grantSubscription(String username, Long userId, SubscriptionPlan plan) {
        User actor = admin(username);
        User target = findUser(userId);
        subscriptionService.grant(target, plan, actor);
        return toAdminUser(target);
    }

    @Transactional
    public AdminUser cancelSubscription(String username, Long userId) {
        admin(username);
        User target = findUser(userId);
        subscriptionService.cancel(target);
        return toAdminUser(target);
    }

    @Transactional(readOnly = true)
    public List<AdminSubject> subjects(String username) {
        admin(username);
        return subjectRepository.findAllByOrderBySortOrderAscNameAsc().stream().map(this::toAdminSubject).toList();
    }

    @Transactional
    public AdminSubject createSubject(String username, SubjectRequest request) {
        admin(username);
        String slug = request.slug() != null && !request.slug().isBlank() ? request.slug() : slugify(request.name());
        if (slug.isEmpty() || subjectRepository.existsBySlug(slug)) {
            throw new ConflictException("Предмет із таким slug уже існує або slug порожній: вкажіть його вручну");
        }
        return toAdminSubject(subjectRepository.save(Subject.builder().slug(slug).name(request.name().trim())
                .sortOrder(request.sortOrder() == null ? 1000 : request.sortOrder())
                .active(request.active() == null || request.active()).build()));
    }

    @Transactional
    public AdminSubject updateSubject(String username, Long id, SubjectRequest request) {
        admin(username);
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Предмет не знайдено: " + id));
        subject.setName(request.name().trim());
        if (request.sortOrder() != null) {
            subject.setSortOrder(request.sortOrder());
        }
        if (request.active() != null) {
            subject.setActive(request.active());
        }
        return toAdminSubject(subjectRepository.save(subject));
    }

    @Transactional
    public void deleteSubject(String username, Long id) {
        admin(username);
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Предмет не знайдено: " + id));
        if (testRepository.countBySubjectId(id) + moduleRepository.countBySubjectId(id) > 0) {
            throw new ConflictException("Предмет використовується матеріалами: вимкніть його замість видалення");
        }
        subjectRepository.delete(subject);
    }

    private AdminSubject toAdminSubject(Subject s) {
        return new AdminSubject(s.getId(), s.getSlug(), s.getName(), s.getSortOrder(), s.isActive(),
                testRepository.countBySubjectId(s.getId()) + moduleRepository.countBySubjectId(s.getId()));
    }

    private boolean hasTeacherData(User teacher) {
        return testRepository.countByOwnerId(teacher.getId()) > 0 || moduleRepository.countByOwnerId(teacher.getId()) > 0
                || userRepository.countByTeacherId(teacher.getId()) > 0;
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + id));
    }

    private static String slugify(String name) {
        String ascii = Normalizer.normalize(name.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("[^a-z0-9]+", "-");
        return ascii.replaceAll("^-+|-+$", "");
    }
}
