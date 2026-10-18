package com.nmt.history.dto;

import com.nmt.history.model.QuestionType;
import java.util.List;

/**
 * Питання без правильних відповідей. {@code imageUrl} - необов'язкове зображення (карта, портрет, пам'ятка).
 * Для MATCHING {@code options} - елементи лівої колонки, а {@code matchChoices} - перемішані
 * варіанти правої колонки, з яких учень обирає відповідник.
 * {@code blankCount} — кількість пропусків для FILL_BLANK (без розкриття еталонів).
 */
public record QuestionResponse(
        Long id,
        String questionText,
        String imageUrl,
        List<String> extraImageUrls,
        QuestionType questionType,
        List<OptionResponse> options,
        List<String> matchChoices,
        Integer blankCount,
        Integer maxPoints) {

    public QuestionResponse(Long id, String questionText, String imageUrl, List<String> extraImageUrls,
                            QuestionType questionType, List<OptionResponse> options, List<String> matchChoices) {
        this(id, questionText, imageUrl, extraImageUrls, questionType, options, matchChoices, null, null);
    }
}
