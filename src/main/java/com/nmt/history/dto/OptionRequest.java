package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;

public record OptionRequest(
        @NotBlank String optionText,
        Boolean isCorrect,
        String matchKey,
        Integer orderIndex) {
}
