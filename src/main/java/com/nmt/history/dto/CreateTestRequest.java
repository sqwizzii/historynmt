package com.nmt.history.dto;

import com.nmt.history.model.ScoringScale;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * {@code subjectId}, {@code grade} і {@code scoringScale} необов'язкові: при створенні шкала за замовчуванням NMT,
 * а при оновленні відсутнє поле означає «без змін».
 */
public record CreateTestRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @Min(1) @Max(300) Integer timeLimitMinutes,
        Long subjectId,
        @Min(1) @Max(11) Integer grade,
        ScoringScale scoringScale) {

    public CreateTestRequest(String title, String description, Integer timeLimitMinutes) {
        this(title, description, timeLimitMinutes, null, null, null);
    }
}
