package com.nmt.history.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Ручне оцінювання одного питання (OPEN) у результаті тесту. */
public record GradeQuestionRequest(
        @NotNull Long questionId,
        @NotNull @Min(0) @Max(100) Integer earned,
        @Size(max = 4000) String comment) {
}
