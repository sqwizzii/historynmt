package com.nmt.history.dto;

import com.nmt.history.model.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateQuestionRequest(
        @NotNull Long testId,
        @NotBlank String questionText,
        @NotNull QuestionType questionType,
        @NotEmpty @Valid List<OptionRequest> options) {
}
