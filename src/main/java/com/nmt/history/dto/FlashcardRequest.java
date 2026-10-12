package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FlashcardRequest(
        @NotBlank String termOrQuestion,
        @NotBlank String answerOrDate,
        @Size(max = 1_500_000, message = "Зображення завелике")
        @Pattern(regexp = "^(data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|https?://\\S{1,2000})?$",
                message = "Невірний формат зображення") String imageUrl) {
}
