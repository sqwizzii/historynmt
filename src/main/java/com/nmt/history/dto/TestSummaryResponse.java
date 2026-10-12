package com.nmt.history.dto;

import com.nmt.history.model.Test;
import java.time.LocalDateTime;

public record TestSummaryResponse(
        Long id,
        String title,
        String description,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        long questionCount) {

    public static TestSummaryResponse from(Test test) {
        return new TestSummaryResponse(test.getId(), test.getTitle(), test.getDescription(),
                test.getTimeLimitMinutes(), test.getCreatedAt(), test.getQuestions().size());
    }
}
