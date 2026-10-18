package com.nmt.history.dto;

import com.nmt.history.model.AnswerVisibilityMode;
import com.nmt.history.model.ScoringScale;
import java.time.LocalDateTime;
import java.util.List;

public record TestDetailResponse(
        Long id,
        String title,
        String description,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        Long subjectId,
        Integer grade,
        ScoringScale scoringScale,
        AnswerVisibilityMode answerVisibilityMode,
        boolean shuffleQuestions,
        boolean shuffleOptions,
        Integer maxAttempts,
        LocalDateTime availableFrom,
        LocalDateTime availableUntil,
        List<QuestionResponse> questions) {
}
