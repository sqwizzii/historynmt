package com.nmt.history.dto;

import com.nmt.history.model.Test;
import java.time.LocalDateTime;

public record TestSummaryResponse(Long id, String title, String description, LocalDateTime createdAt) {

    public static TestSummaryResponse from(Test test) {
        return new TestSummaryResponse(test.getId(), test.getTitle(), test.getDescription(), test.getCreatedAt());
    }
}
