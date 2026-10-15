package com.nmt.history.service;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Підписані короткоживучі посилання на зображення питань і варіантів. Тег {@code <img>} не може передати JWT,
 * тому доступ до зображень приватних матеріалів підтверджується HMAC-SHA256 від шляху й часу завершення дії.
 * Ключ окремий (виводиться з секрету JWT), тож токен посилання не можна використати як JWT і навпаки.
 */
@Component
public class ImageUrlSigner {

    private static final String KEY_LABEL = "image-url-v1";
    private static final Base64.Encoder ENCODER = Base64.getUrlEncoder().withoutPadding();

    private final byte[] key;
    private final Duration ttl;
    private final Clock clock;

    @Autowired
    public ImageUrlSigner(@Value("${app.jwt.secret}") String base64Secret,
                          @Value("${app.images.url-ttl-minutes:360}") long ttlMinutes) {
        this(base64Secret, Duration.ofMinutes(ttlMinutes), Clock.systemUTC());
    }

    ImageUrlSigner(String base64Secret, Duration ttl, Clock clock) {
        this.key = hmac(Base64.getDecoder().decode(base64Secret), KEY_LABEL.getBytes(StandardCharsets.UTF_8));
        this.ttl = ttl;
        this.clock = clock;
    }

    /** Додає {@code exp} і {@code sig} до власного посилання на зображення; інші посилання повертає без змін. */
    public String sign(String url) {
        if (url == null) {
            return null;
        }
        String path = QuestionImages.pathOf(url);
        if (path == null) {
            return url;
        }
        long exp = clock.instant().plus(ttl).getEpochSecond();
        return path + "?exp=" + exp + "&sig=" + signature(path, exp);
    }

    /** Перевіряє підпис і термін дії для заданого шляху зображення. */
    public boolean verify(String path, String exp, String sig) {
        if (path == null || exp == null || sig == null) {
            return false;
        }
        long expiresAt;
        try {
            expiresAt = Long.parseLong(exp);
        } catch (NumberFormatException e) {
            return false;
        }
        if (expiresAt <= clock.instant().getEpochSecond()) {
            return false;
        }
        byte[] expected = signature(path, expiresAt).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, sig.getBytes(StandardCharsets.UTF_8));
    }

    private String signature(String path, long exp) {
        return ENCODER.encodeToString(hmac(key, (path + "|" + exp).getBytes(StandardCharsets.UTF_8)));
    }

    private static byte[] hmac(byte[] key, byte[] data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HMAC недоступний", e);
        }
    }
}
