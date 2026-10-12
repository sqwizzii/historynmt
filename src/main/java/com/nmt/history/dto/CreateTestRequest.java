package com.nmt.history.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTestRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @Min(1) @Max(300) Integer timeLimitMinutes) {
}
