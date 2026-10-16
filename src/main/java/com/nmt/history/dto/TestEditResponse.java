package com.nmt.history.dto;

import com.nmt.history.model.ScoringScale;
import java.time.LocalDateTime;
import java.util.List;

public record TestEditResponse(
        Long id,
        String title,
        String description,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        Long subjectId,
        Integer grade,
        ScoringScale scoringScale,
        com.nmt.history.model.AnswerVisibilityMode answerVisibilityMode,
        List<QuestionEditResponse> questions) {
}
