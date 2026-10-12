package com.nmt.history.dto;

import java.time.LocalDateTime;
import java.util.List;

public record TestDetailResponse(
        Long id,
        String title,
        String description,
        LocalDateTime createdAt,
        List<QuestionResponse> questions) {
}
