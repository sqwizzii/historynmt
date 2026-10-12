package com.nmt.history.dto;

public record StudentResponse(Long id, String username, String email, long attempts, Integer bestNmtScore) {
}
