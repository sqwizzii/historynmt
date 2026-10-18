package com.nmt.history.dto;

import com.nmt.history.model.AnswerVisibilityMode;
import com.nmt.history.model.ScoringScale;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

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
        ScoringScale scoringScale,
        AnswerVisibilityMode answerVisibilityMode,
        Boolean shuffleQuestions,
        Boolean shuffleOptions,
        @Min(1) @Max(100) Integer maxAttempts,
        LocalDateTime availableFrom,
        LocalDateTime availableUntil,
        /** Якщо true — скинути maxAttempts у NULL (необмежено). */
        Boolean clearMaxAttempts,
        Boolean clearAvailability) {

    public CreateTestRequest(String title, String description, Integer timeLimitMinutes, Long subjectId, Integer grade,
                             ScoringScale scoringScale) {
        this(title, description, timeLimitMinutes, subjectId, grade, scoringScale, null,
                null, null, null, null, null, null, null);
    }

    public CreateTestRequest(String title, String description, Integer timeLimitMinutes, Long subjectId, Integer grade,
                             ScoringScale scoringScale, AnswerVisibilityMode answerVisibilityMode) {
        this(title, description, timeLimitMinutes, subjectId, grade, scoringScale, answerVisibilityMode,
                null, null, null, null, null, null, null);
    }

    public CreateTestRequest(String title, String description, Integer timeLimitMinutes) {
        this(title, description, timeLimitMinutes, null, null, null, null,
                null, null, null, null, null, null, null);
    }
}
