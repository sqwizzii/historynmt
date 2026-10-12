package com.nmt.history.dto;

import java.util.List;

public record TestStatsResponse(int attempts, List<QuestionStat> questions) {

    public record QuestionStat(Long questionId, String questionText, int answered, int wrong, int correctPercent) {
    }
}
