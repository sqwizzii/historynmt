package com.nmt.history.dto;

public record AttemptResponse(Long attemptId, long remainingSeconds, int leaveCount, java.util.List<QuestionReview> checked,
                              java.util.List<AnswerRequest> lockedAnswers) {
}
