package com.nmt.history.dto;

import java.util.List;

public record TestStatsResponse(
        int attempts,
        int completed,
        int pendingReview,
        double averageScorePercent,
        double averageCorrectPercent,
        List<QuestionStat> questions) {

    public TestStatsResponse(int attempts, List<QuestionStat> questions) {
        this(attempts, attempts, 0, 0, 0, questions);
    }

    public record QuestionStat(
            Long questionId,
            String questionText,
            String questionType,
            int answered,
            int wrong,
            int pending,
            int correctPercent) {

        public QuestionStat(Long questionId, String questionText, int answered, int wrong, int correctPercent) {
            this(questionId, questionText, null, answered, wrong, 0, correctPercent);
        }
    }
}
