package com.nmt.history.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TestEditResponse(
        Long id,
        String title,
        String description,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        List<QuestionEditResponse> questions) {
}
