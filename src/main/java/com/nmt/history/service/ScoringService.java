package com.nmt.history.service;

import com.nmt.history.dto.AnswerRequest;
import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Правила нарахування первинних балів за типом питання:
 * <ul>
 *   <li>SINGLE_CHOICE - 1 бал за правильний варіант;</li>
 *   <li>MULTIPLE_CHOICE - за кожен правильно обраний варіант +1, за кожен зайвий -1 (не менше 0);
 *       максимум - кількість правильних варіантів;</li>
 *   <li>MATCHING - 1 бал за кожну правильно підібрану пару;</li>
 *   <li>CHRONOLOGY - 1 бал, якщо весь ряд подій розташовано правильно.</li>
 * </ul>
 */
@Component
public class ScoringService {

    public int maxScore(Question question) {
        List<Option> options = question.getOptions();
        return switch (question.getQuestionType()) {
            case SINGLE_CHOICE, CHRONOLOGY -> 1;
            case MULTIPLE_CHOICE -> (int) options.stream().filter(this::isCorrect).count();
            case MATCHING -> (int) options.stream().filter(o -> hasText(o.getMatchKey())).count();
        };
    }

    public int score(Question question, AnswerRequest answer) {
        if (answer == null) {
            return 0;
        }
        return switch (question.getQuestionType()) {
            case SINGLE_CHOICE -> scoreSingle(question, answer);
            case MULTIPLE_CHOICE -> scoreMultiple(question, answer);
            case MATCHING -> scoreMatching(question, answer);
            case CHRONOLOGY -> scoreChronology(question, answer);
        };
    }

    private int scoreSingle(Question question, AnswerRequest answer) {
        Set<Long> correct = correctOptionIds(question);
        Set<Long> selected = toSet(answer.selectedOptionIds());
        return !correct.isEmpty() && selected.equals(correct) ? 1 : 0;
    }

    private int scoreMultiple(Question question, AnswerRequest answer) {
        Set<Long> correct = correctOptionIds(question);
        Set<Long> selected = toSet(answer.selectedOptionIds());
        long hits = selected.stream().filter(correct::contains).count();
        long misses = selected.size() - hits;
        return (int) Math.max(0, hits - misses);
    }

    private int scoreMatching(Question question, AnswerRequest answer) {
        Map<Long, String> given = answer.matches();
        if (given == null || given.isEmpty()) {
            return 0;
        }
        int points = 0;
        for (Option option : question.getOptions()) {
            if (!hasText(option.getMatchKey())) {
                continue;
            }
            String chosen = given.get(option.getId());
            if (chosen != null && normalize(chosen).equals(normalize(option.getMatchKey()))) {
                points++;
            }
        }
        return points;
    }

    private int scoreChronology(Question question, AnswerRequest answer) {
        List<Long> expected = question.getOptions().stream()
                .sorted(Comparator.comparing(Option::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(Option::getId)
                .toList();
        return !expected.isEmpty() && expected.equals(answer.orderedOptionIds()) ? 1 : 0;
    }

    private Set<Long> correctOptionIds(Question question) {
        return question.getOptions().stream()
                .filter(this::isCorrect)
                .map(Option::getId)
                .collect(Collectors.toSet());
    }

    private boolean isCorrect(Option option) {
        return Boolean.TRUE.equals(option.getIsCorrect());
    }

    private Set<Long> toSet(Collection<Long> ids) {
        return ids == null ? Set.of() : new HashSet<>(ids);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String normalize(String value) {
        return value.trim().toLowerCase();
    }
}
