package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTestRequest(
        @NotBlank @Size(max = 255) String title,
        String description) {
}
