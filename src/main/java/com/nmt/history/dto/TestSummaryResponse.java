package com.nmt.history.dto;

import com.nmt.history.model.AnswerVisibilityMode;
import com.nmt.history.model.ScoringScale;
import com.nmt.history.model.Test;
import java.time.LocalDateTime;

/** {@code system} - загальноплатформний матеріал, {@code editable} - чи може поточний користувач його змінювати. */
public record TestSummaryResponse(
        Long id,
        String title,
        String description,
        Integer timeLimitMinutes,
        LocalDateTime createdAt,
        long questionCount,
        Long subjectId,
        Integer grade,
        ScoringScale scoringScale,
        AnswerVisibilityMode answerVisibilityMode,
        boolean shuffleQuestions,
        boolean shuffleOptions,
        Integer maxAttempts,
        LocalDateTime availableFrom,
        LocalDateTime availableUntil,
        boolean system,
        boolean editable) {

    public static TestSummaryResponse from(Test test, long questionCount, boolean editable) {
        return new TestSummaryResponse(test.getId(), test.getTitle(), test.getDescription(),
                test.getTimeLimitMinutes(), test.getCreatedAt(), questionCount,
                test.getSubject() == null ? null : test.getSubject().getId(), test.getGrade(),
                test.getScoringScale(), test.getAnswerVisibilityMode(),
                test.isShuffleQuestions(), test.isShuffleOptions(), test.getMaxAttempts(),
                test.getAvailableFrom(), test.getAvailableUntil(),
                test.getOwner() == null, editable);
    }
}
