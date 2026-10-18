package com.nmt.history.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.nmt.history.model.QuestionType;
import java.util.List;

/** Розбір одного питання після проходження тесту. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuestionReview(
        Long questionId,
        String questionText,
        String imageUrl,
        QuestionType questionType,
        int earned,
        int max,
        List<String> yourAnswer,
        List<String> correctAnswer,
        String explanation,
        String topic,
        List<String> extraImageUrls,
        boolean needsManualGrading,
        boolean pendingManual,
        String teacherComment) {

    public QuestionReview(Long questionId, String questionText, String imageUrl, QuestionType questionType,
                          int earned, int max, List<String> yourAnswer, List<String> correctAnswer,
                          String explanation, String topic, List<String> extraImageUrls) {
        this(questionId, questionText, imageUrl, questionType, earned, max, yourAnswer, correctAnswer,
                explanation, topic, extraImageUrls, false, false, null);
    }

    public QuestionReview withManual(int earned, boolean pending, String comment) {
        return new QuestionReview(questionId, questionText, imageUrl, questionType, earned, max, yourAnswer,
                correctAnswer, explanation, topic, extraImageUrls, needsManualGrading, pending, comment);
    }
}
