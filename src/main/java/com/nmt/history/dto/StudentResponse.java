package com.nmt.history.dto;

public record StudentResponse(Long id, String username, String fullName, long attempts, Integer bestNmtScore) {
}
