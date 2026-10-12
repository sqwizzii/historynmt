package com.nmt.history.dto;

import com.nmt.history.model.Role;

public record JwtResponse(String token, String tokenType, String username, Role role) {

    public static JwtResponse bearer(String token, String username, Role role) {
        return new JwtResponse(token, "Bearer", username, role);
    }
}
