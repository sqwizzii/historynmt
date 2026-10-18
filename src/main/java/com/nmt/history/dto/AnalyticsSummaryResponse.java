package com.nmt.history.dto;

import java.util.List;

/** Зведена аналітика для кабінету вчителя. */
public record AnalyticsSummaryResponse(
        int totalAttempts,
        int completedTests,
        int pendingReview,
        double averageScorePercent,
        double averageCorrectPercent,
        List<StudentAttemptStat> byStudent,
        List<HardQuestionStat> hardestQuestions) {

    public record StudentAttemptStat(
            Long studentId,
            String studentName,
            String username,
            int attempts,
            Double averagePercent,
            Integer bestScore,
            Integer bestMax) {
    }

    public record HardQuestionStat(
            Long questionId,
            Long testId,
            String testTitle,
            String questionText,
            int answered,
            int wrong,
            int pending,
            int correctPercent) {
    }
}
