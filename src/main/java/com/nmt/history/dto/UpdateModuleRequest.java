package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateModuleRequest(
        @NotBlank @Size(max = 255) String title,
        String description) {
}
