package com.nmt.history.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateModuleRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        Long subjectId,
        @Min(1) @Max(11) Integer grade) {

    public UpdateModuleRequest(String title, String description) {
        this(title, description, null, null);
    }
}
