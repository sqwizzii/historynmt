package com.nmt.history.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.nmt.history.model.TestResult;
import java.time.LocalDateTime;
import java.util.List;

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
        LocalDateTime completedAt,
        boolean late,
        int leaveCount,
        String endReason,
        List<QuestionReview> review) {

    public static TestResultResponse from(TestResult result) {
        return from(result, null, null);
    }

    public static TestResultResponse from(TestResult result, Integer maxScore, List<QuestionReview> review) {
        return new TestResultResponse(
                result.getId(),
                result.getTest().getId(),
                result.getTest().getTitle(),
                result.getStudent().getId(),
                result.getStudent().getUsername(),
                result.getScore(),
                maxScore,
                result.getNmtScore(),
                result.getCompletedAt(),
                result.isLate(),
                result.getLeaveCount(),
                result.getEndReason(),
                review);
    }
}
