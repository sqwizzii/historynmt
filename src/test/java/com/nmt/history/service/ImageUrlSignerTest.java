package com.nmt.history.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class ImageUrlSignerTest {

    private static final String SECRET = Base64.getEncoder().encodeToString("unit-test-secret-unit-test-secret!".getBytes());
    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    private static final String PATH = "/api/tests/questions/42/image";

    private static ImageUrlSigner signer(Instant now) {
        return new ImageUrlSigner(SECRET, Duration.ofMinutes(10), Clock.fixed(now, ZoneOffset.UTC));
    }

    private static String param(String url, String name) {
        for (String pair : url.substring(url.indexOf('?') + 1).split("&")) {
            if (pair.startsWith(name + "=")) {
                return pair.substring(name.length() + 1);
            }
        }
        return null;
    }

    @Test
    void signedUrlVerifiesUntilItExpires() {
        String url = signer(NOW).sign(PATH);
        assertTrue(url.startsWith(PATH + "?exp="));
        assertEquals(String.valueOf(NOW.plusSeconds(600).getEpochSecond()), param(url, "exp"));
        assertTrue(signer(NOW).verify(PATH, param(url, "exp"), param(url, "sig")));
        assertTrue(signer(NOW.plusSeconds(599)).verify(PATH, param(url, "exp"), param(url, "sig")));
        assertFalse(signer(NOW.plusSeconds(600)).verify(PATH, param(url, "exp"), param(url, "sig")));
        assertFalse(signer(NOW.plusSeconds(3600)).verify(PATH, param(url, "exp"), param(url, "sig")));
    }

    @Test
    void tamperingWithPathExpiryOrSignatureIsRejected() {
        String url = signer(NOW).sign(PATH);
        String exp = param(url, "exp");
        String sig = param(url, "sig");
        ImageUrlSigner signer = signer(NOW);
        assertFalse(signer.verify("/api/tests/questions/43/image", exp, sig));
        assertFalse(signer.verify("/api/tests/options/42/image", exp, sig));
        assertFalse(signer.verify(PATH, String.valueOf(Long.parseLong(exp) + 1), sig));
        assertFalse(signer.verify(PATH, exp, sig.substring(0, sig.length() - 1) + (sig.endsWith("A") ? "B" : "A")));
        assertFalse(signer.verify(PATH, exp, ""));
        assertFalse(signer.verify(PATH, "abc", sig));
        assertFalse(signer.verify(PATH, null, sig));
        assertFalse(signer.verify(PATH, exp, null));
        assertFalse(signer.verify(null, exp, sig));
    }

    @Test
    void signatureDependsOnTheServerSecret() {
        String otherSecret = Base64.getEncoder().encodeToString("another-secret-another-secret-123".getBytes());
        ImageUrlSigner other = new ImageUrlSigner(otherSecret, Duration.ofMinutes(10), Clock.fixed(NOW, ZoneOffset.UTC));
        String url = signer(NOW).sign(PATH);
        assertNotEquals(url, other.sign(PATH));
        assertFalse(other.verify(PATH, param(url, "exp"), param(url, "sig")));
    }

    @Test
    void onlyOwnImagePathsAreSigned() {
        ImageUrlSigner signer = signer(NOW);
        assertNull(signer.sign(null));
        assertEquals("https://example.com/a.png", signer.sign("https://example.com/a.png"));
        assertEquals("data:image/png;base64,AAAA", signer.sign("data:image/png;base64,AAAA"));
        assertTrue(signer.sign("/api/tests/options/7/image").contains("?exp="));
    }

    @Test
    void resigningAnAlreadySignedUrlReplacesTheOldSignature() {
        ImageUrlSigner signer = signer(NOW);
        String once = signer.sign(PATH);
        String twice = signer(NOW.plusSeconds(60)).sign(once);
        assertEquals(1, twice.split("exp=", -1).length - 1);
        assertTrue(signer(NOW.plusSeconds(60)).verify(PATH, param(twice, "exp"), param(twice, "sig")));
    }
}
