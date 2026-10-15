package com.nmt.history.service;

import com.nmt.history.exception.ConflictException;
import com.nmt.history.model.AppSetting;
import com.nmt.history.model.User;
import com.nmt.history.repository.AppSettingRepository;
import com.nmt.history.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Locale;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Коди запрошення учнів: у кожного вчителя свій. Код зберігається в app_settings під ключем {@code invite:<id вчителя>};
 * код вчителя з LEGACY_TEACHER_USERNAME залишається під старим ключем {@code invite_code}, тож чинні посилання працюють.
 */
@Service
public class InviteCodeService {

    private static final String LEGACY_KEY = "invite_code";
    private static final String PREFIX = "invite:";
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int LENGTH = 8;

    private final AppSettingRepository repository;
    private final UserRepository userRepository;
    private final String legacyTeacherUsername;
    private final SecureRandom random = new SecureRandom();

    public InviteCodeService(AppSettingRepository repository, UserRepository userRepository,
                             @Value("${app.legacy.teacher-username:}") String legacyTeacherUsername) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.legacyTeacherUsername = legacyTeacherUsername == null ? "" : legacyTeacherUsername.trim();
    }

    /** Код вчителя з LEGACY_TEACHER_USERNAME (для сумісності й тестів). */
    @Transactional
    public String current() {
        return repository.findById(LEGACY_KEY).map(AppSetting::getValue).orElseGet(() -> store(LEGACY_KEY, generate()));
    }

    @Transactional
    public String current(User teacher) {
        String key = keyFor(teacher);
        return repository.findById(key).map(AppSetting::getValue).orElseGet(() -> store(key, generate()));
    }

    @Transactional
    public String regenerate(User teacher) {
        return store(keyFor(teacher), generate());
    }

    @Transactional
    public String set(User teacher, String code) {
        String normalized = code.trim().toUpperCase(Locale.ROOT);
        String key = keyFor(teacher);
        repository.findAll().stream()
                .filter(setting -> isCodeKey(setting.getKey()) && !setting.getKey().equals(key)
                        && setting.getValue().equals(normalized))
                .findAny()
                .ifPresent(setting -> {
                    throw new ConflictException("Такий код запрошення вже використовується");
                });
        return store(key, normalized);
    }

    /** Вчитель, якому належить код; порожньо, якщо коду не існує. Порівняння у сталий час. */
    @Transactional(readOnly = true)
    public Optional<Long> resolveTeacherId(String candidate) {
        if (candidate == null || candidate.isBlank()) {
            return Optional.empty();
        }
        byte[] given = candidate.trim().toUpperCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8);
        Long found = null;
        for (AppSetting setting : repository.findAll()) {
            if (isCodeKey(setting.getKey())
                    && MessageDigest.isEqual(setting.getValue().getBytes(StandardCharsets.UTF_8), given)) {
                found = teacherIdOf(setting.getKey());
            }
        }
        return Optional.ofNullable(found);
    }

    private boolean isCodeKey(String key) {
        return LEGACY_KEY.equals(key) || key.startsWith(PREFIX);
    }

    private Long teacherIdOf(String key) {
        if (LEGACY_KEY.equals(key)) {
            return legacyTeacherUsername.isEmpty() ? null : userRepository.findByUsername(legacyTeacherUsername)
                    .map(User::getId).orElse(null);
        }
        try {
            return Long.valueOf(key.substring(PREFIX.length()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private String keyFor(User teacher) {
        return !legacyTeacherUsername.isEmpty() && teacher.getUsername().equals(legacyTeacherUsername)
                ? LEGACY_KEY : PREFIX + teacher.getId();
    }

    private String store(String key, String code) {
        repository.save(new AppSetting(key, code));
        return code;
    }

    private String generate() {
        StringBuilder code = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            code.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }
}
