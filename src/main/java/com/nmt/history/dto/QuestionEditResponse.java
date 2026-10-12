package com.nmt.history.dto;

import com.nmt.history.model.QuestionType;
import java.util.List;

/** Питання для вчителя з правильними відповідями та поясненням. */
public record QuestionEditResponse(
        Long id,
        String questionText,
        String imageUrl,
        QuestionType questionType,
        String explanation,
        List<OptionEditResponse> options) {
}
