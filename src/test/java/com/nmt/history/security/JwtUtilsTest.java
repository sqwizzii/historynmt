package com.nmt.history.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nmt.history.model.Role;
import java.util.Base64;
import org.junit.jupiter.api.Test;

class JwtUtilsTest {

    private static final String SECRET = Base64.getEncoder()
            .encodeToString("unit-test-secret-key-with-at-least-32-bytes!".getBytes());

    @Test
    void generatedTokenIsValidAndCarriesUsername() {
        JwtUtils utils = new JwtUtils(SECRET, 60_000);
        String token = utils.generateToken("artem", Role.TEACHER);
        assertTrue(utils.isValid(token));
        assertEquals("artem", utils.getUsername(token));
    }

    @Test
    void rejectsExpiredTamperedAndGarbageTokens() {
        JwtUtils utils = new JwtUtils(SECRET, 60_000);
        assertFalse(new JwtUtils(SECRET, -1_000).isValid(new JwtUtils(SECRET, -1_000).generateToken("a", Role.STUDENT)));
        assertFalse(utils.isValid(utils.generateToken("a", Role.STUDENT) + "x"));
        assertFalse(utils.isValid("not-a-jwt"));
    }
}
