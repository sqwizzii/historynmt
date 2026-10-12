package com.nmt.history.service;

import com.nmt.history.model.AppSetting;
import com.nmt.history.repository.AppSettingRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Код запрошення, без якого учень не може зареєструватися. Створюється автоматично, вчитель може його змінити. */
@Service
@RequiredArgsConstructor
public class InviteCodeService {

    private static final String KEY = "invite_code";
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final int LENGTH = 8;

    private final AppSettingRepository repository;
    private final SecureRandom random = new SecureRandom();

    @Transactional
    public String current() {
        return repository.findById(KEY).map(AppSetting::getValue).orElseGet(() -> store(generate()));
    }

    @Transactional
    public String regenerate() {
        return store(generate());
    }

    @Transactional
    public String set(String code) {
        return store(code.trim().toUpperCase(Locale.ROOT));
    }

    @Transactional(readOnly = true)
    public boolean matches(String candidate) {
        if (candidate == null) {
            return false;
        }
        String expected = repository.findById(KEY).map(AppSetting::getValue).orElse(null);
        if (expected == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                candidate.trim().toUpperCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
    }

    private String store(String code) {
        repository.save(new AppSetting(KEY, code));
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
