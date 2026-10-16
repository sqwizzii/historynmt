package com.nmt.history.dto;

import com.nmt.history.model.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateQuestionRequest(
        @NotNull Long testId,
        @NotBlank String questionText,
        @Size(max = 1_500_000, message = "Зображення завелике")
        @Pattern(regexp = "^(https?://\\S{1,2000}|data:image/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+|/api/tests/questions/\\d+/image(\\?[A-Za-z0-9_=&.-]{0,300})?)?$",
                message = "Невірний формат зображення") String imageUrl,
        @NotNull QuestionType questionType,
        String explanation,
        @Size(max = 100) String topic,
        @NotEmpty @Valid List<OptionRequest> options,
        List<String> extraImageUrls,
        List<String> extraMatchChoices) {
    public CreateQuestionRequest(Long testId, String questionText, String imageUrl, QuestionType questionType,
                                 String explanation, String topic, List<OptionRequest> options) {
        this(testId, questionText, imageUrl, questionType, explanation, topic, options, null, null);
    }
}
