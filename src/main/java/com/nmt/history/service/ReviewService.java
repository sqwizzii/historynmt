package com.nmt.history.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nmt.history.dto.AnswerRequest;
import com.nmt.history.dto.QuestionReview;
import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/** Формує розбір відповідей учня (людиночитний) та (де)серіалізує його для збереження в результаті. */
@Component
@RequiredArgsConstructor
public class ReviewService {

    private static final String UNANSWERED = "\u2014";
    private static final TypeReference<List<QuestionReview>> REVIEW_LIST = new TypeReference<>() { };

    private final ObjectMapper objectMapper;

    public QuestionReview build(Question question, AnswerRequest answer, int earned, int max) {
        return new QuestionReview(
                question.getId(),
                question.getQuestionText(),
                question.getImageUrl(),
                question.getQuestionType(),
                earned,
                max,
                yourAnswer(question, answer),
                correctAnswer(question),
                question.getExplanation(),
                question.getTopic());
    }

    public String toJson(List<QuestionReview> review) {
        try {
            return objectMapper.writeValueAsString(review);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Не вдалося серіалізувати розбір відповідей", e);
        }
    }

    public List<QuestionReview> fromJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(json, REVIEW_LIST);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private List<String> correctAnswer(Question question) {
        List<Option> options = question.getOptions();
        return switch (question.getQuestionType()) {
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> options.stream()
                    .filter(o -> Boolean.TRUE.equals(o.getIsCorrect()))
                    .map(Option::getOptionText)
                    .toList();
            case MATCHING -> options.stream()
                    .filter(o -> o.getMatchKey() != null)
                    .map(o -> o.getOptionText() + " \u2192 " + o.getMatchKey())
                    .toList();
            case CHRONOLOGY -> options.stream()
                    .sorted(Comparator.comparing(Option::getOrderIndex, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(Option::getOptionText)
                    .toList();
        };
    }

    private List<String> yourAnswer(Question question, AnswerRequest answer) {
        if (answer == null) {
            return List.of();
        }
        Map<Long, Option> byId = question.getOptions().stream()
                .collect(Collectors.toMap(Option::getId, Function.identity()));
        return switch (question.getQuestionType()) {
            case SINGLE_CHOICE, MULTIPLE_CHOICE -> texts(answer.selectedOptionIds(), byId);
            case CHRONOLOGY -> texts(answer.orderedOptionIds(), byId);
            case MATCHING -> {
                if (answer.matches() == null || answer.matches().isEmpty()) {
                    yield List.of();
                }
                yield question.getOptions().stream()
                        .filter(o -> o.getMatchKey() != null)
                        .map(o -> o.getOptionText() + " \u2192 " + answer.matches().getOrDefault(o.getId(), UNANSWERED))
                        .toList();
            }
        };
    }

    private List<String> texts(List<Long> ids, Map<Long, Option> byId) {
        if (ids == null) {
            return List.of();
        }
        return ids.stream().map(byId::get).filter(Objects::nonNull).map(Option::getOptionText).toList();
    }
}
