package com.nmt.history.dto;

import java.util.List;

public record PracticeResultResponse(int fixed, int total, List<QuestionReview> review) {
}
