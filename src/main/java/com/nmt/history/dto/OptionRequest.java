package com.nmt.history.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OptionRequest(
        @NotBlank String optionText,
        Boolean isCorrect,
        String matchKey,
        Integer orderIndex,
        @Size(max = 1_500_000, message = "Зображення завелике")
        @Pattern(regexp = "^(https?://\\S{1,2000}|data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|/api/tests/options/\\d+/image(\\?[A-Za-z0-9_=&.-]{0,300})?)?$",
                message = "Невірний формат зображення") String imageUrl) {
}
