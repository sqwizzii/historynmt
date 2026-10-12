package com.nmt.history.dto;

import com.nmt.history.model.QuestionType;
import java.util.List;

/** Розбір одного питання після проходження тесту. */
public record QuestionReview(
        Long questionId,
        String questionText,
        String imageUrl,
        QuestionType questionType,
        int earned,
        int max,
        List<String> yourAnswer,
        List<String> correctAnswer,
        String explanation) {
}
