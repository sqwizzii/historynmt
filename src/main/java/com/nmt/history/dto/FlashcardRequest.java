package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;

public record FlashcardRequest(
        @NotBlank String termOrQuestion,
        @NotBlank String answerOrDate) {
}
