package com.nmt.history.dto;

public record AttemptResponse(long remainingSeconds, int leaveCount, java.util.List<QuestionReview> checked) {
}
