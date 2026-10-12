package com.nmt.history.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.nmt.history.model.TestResult;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record TestResultResponse(
        Long id,
        Long testId,
        String testTitle,
        Long studentId,
        String studentUsername,
        Integer score,
        Integer maxScore,
        Integer nmtScore,
        LocalDateTime completedAt) {

    public static TestResultResponse from(TestResult result) {
        return from(result, null);
    }

    public static TestResultResponse from(TestResult result, Integer maxScore) {
        return new TestResultResponse(
                result.getId(),
                result.getTest().getId(),
                result.getTest().getTitle(),
                result.getStudent().getId(),
                result.getStudent().getUsername(),
                result.getScore(),
                maxScore,
                result.getNmtScore(),
                result.getCompletedAt());
    }
}
