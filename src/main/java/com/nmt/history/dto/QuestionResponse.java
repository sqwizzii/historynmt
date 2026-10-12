package com.nmt.history.dto;

import com.nmt.history.model.QuestionType;
import java.util.List;

/**
 * Питання без правильних відповідей.
 * Для MATCHING {@code options} - елементи лівої колонки, а {@code matchChoices} - перемішані
 * варіанти правої колонки, з яких учень обирає відповідник.
 */
public record QuestionResponse(
        Long id,
        String questionText,
        QuestionType questionType,
        List<OptionResponse> options,
        List<String> matchChoices) {
}
