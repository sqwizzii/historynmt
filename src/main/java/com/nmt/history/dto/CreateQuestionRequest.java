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
        @Size(max = 2048) @Pattern(regexp = "^(https?://\\S+)?$", message = "imageUrl має бути http(s)-посиланням") String imageUrl,
        @NotNull QuestionType questionType,
        @NotEmpty @Valid List<OptionRequest> options) {
}
