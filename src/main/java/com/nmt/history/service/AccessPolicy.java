package com.nmt.history.service;

import com.nmt.history.exception.ForbiddenException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Єдине місце правил доступу до матеріалів, учнів і результатів. Хто виконує запит визначається лише за
 * автентифікованим користувачем із БД; роль, власник чи вчитель із тіла запиту ніколи не використовуються.
 *
 * <p>Матеріал із {@code ownerId == null} є загальноплатформним: його бачать усі (включно з анонімами),
 * змінює лише адміністратор. Приватний матеріал бачить власник-вчитель і його учні, змінює лише власник.
 * Адміністратор приватних матеріалів, учнів і результатів вчителів не бачить.
 */
@Component
@RequiredArgsConstructor
public class AccessPolicy {

    private final UserRepository userRepository;

    @Value("${app.legacy.teacher-username:}")
    private String legacyTeacherUsername;

    /** Користувач запиту або {@code null} для анонімного. */
    public User actor(String username) {
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username).orElse(null);
    }

    public User requireActor(String username) {
        User actor = actor(username);
        if (actor == null) {
            throw new ResourceNotFoundException("Користувача не знайдено");
        }
        return actor;
    }

    public User requireTeacher(String username) {
        User actor = requireActor(username);
        if (actor.getRole() != Role.TEACHER) {
            throw new ForbiddenException("Дія доступна лише вчителю");
        }
        return actor;
    }

    /** Власники, чиї приватні матеріали бачить користувач (окрім системних); {@code null} якщо таких немає. */
    public Long visibleOwnerId(User actor) {
        if (actor == null) {
            return null;
        }
        return switch (actor.getRole()) {
            case TEACHER -> actor.getId();
            case STUDENT -> actor.getTeacherId();
            case ADMIN -> null;
        };
    }

    public boolean canView(Long ownerId, User actor) {
        return ownerId == null || ownerId.equals(visibleOwnerId(actor));
    }

    public boolean canEdit(Long ownerId, User actor) {
        if (actor == null) {
            return false;
        }
        return switch (actor.getRole()) {
            case ADMIN -> ownerId == null;
            case TEACHER -> ownerId != null && ownerId.equals(actor.getId());
            case STUDENT -> false;
        };
    }

    /** Чужий приватний матеріал для користувача не існує (404), системний лише для читання (403). */
    public void requireEdit(Long ownerId, User actor) {
        if (!canView(ownerId, actor) && !(actor != null && actor.getRole() == Role.ADMIN && ownerId == null)) {
            throw new ResourceNotFoundException("Матеріал не знайдено");
        }
        if (!canEdit(ownerId, actor)) {
            throw new ForbiddenException("Загальноплатформні матеріали змінює лише адміністратор");
        }
    }

    public void requireView(Long ownerId, User actor) {
        if (!canView(ownerId, actor)) {
            throw new ResourceNotFoundException("Матеріал не знайдено");
        }
    }

    /** Власник для нового матеріалу: вчитель стає власником, адміністратор створює системний (NULL). */
    public User ownerForNew(User actor) {
        if (actor.getRole() == Role.ADMIN) {
            return null;
        }
        if (actor.getRole() == Role.TEACHER) {
            return actor;
        }
        throw new ForbiddenException("Створювати матеріали може лише вчитель або адміністратор");
    }

    /**
     * Поки коди запрошення спільні (до етапу 3), керувати ними можуть лише адміністратор і вчитель, до якого
     * прив'язуються нові учні; інакше один вчитель міг би змінити код для іншого.
     */
    public void requireInviteCodeManager(User actor) {
        if (actor.getRole() == Role.ADMIN) {
            return;
        }
        if (actor.getRole() == Role.TEACHER && !legacyTeacherUsername.isBlank()
                && actor.getUsername().equals(legacyTeacherUsername)) {
            return;
        }
        throw new ForbiddenException("Керувати кодом запрошення не дозволено");
    }

    /** Учень цього вчителя, інакше 404 (підміна id не розкриває існування чужих учнів). */
    public User requireOwnStudent(User teacher, Long studentId) {
        return userRepository.findById(studentId)
                .filter(user -> user.getRole() == Role.STUDENT && teacher.getId().equals(user.getTeacherId()))
                .orElseThrow(() -> new ResourceNotFoundException("Учня не знайдено: " + studentId));
    }
}
