package com.nmt.history.dto;

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
        List<QuestionResponse> questions) {
}
