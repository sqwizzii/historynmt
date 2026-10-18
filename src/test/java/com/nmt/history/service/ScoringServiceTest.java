package com.nmt.history.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.nmt.history.dto.AnswerRequest;
import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import com.nmt.history.model.QuestionType;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ScoringServiceTest {

    private final ScoringService scoring = new ScoringService();

    private Question question(QuestionType type, Option... options) {
        Question q = Question.builder().id(1L).questionType(type).questionText("q").maxPoints(1).build();
        for (Option o : options) {
            q.addOption(o);
        }
        return q;
    }

    private Option choice(long id, boolean correct) {
        return Option.builder().id(id).optionText("o" + id).isCorrect(correct).build();
    }

    @Test
    void singleChoice() {
        Question q = question(QuestionType.SINGLE_CHOICE, choice(1, false), choice(2, true), choice(3, false));
        assertEquals(1, scoring.maxScore(q));
        assertEquals(1, scoring.score(q, new AnswerRequest(1L, List.of(2L), null, null)));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, List.of(1L), null, null)));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, List.of(1L, 2L), null, null)));
        assertEquals(0, scoring.score(q, null));
    }

    @Test
    void multipleChoiceGivesPartialCreditAndPenalizesWrongPicks() {
        Question q = question(QuestionType.MULTIPLE_CHOICE,
                choice(1, true), choice(2, true), choice(3, true), choice(4, false), choice(5, false));
        assertEquals(3, scoring.maxScore(q));
        assertEquals(3, scoring.score(q, new AnswerRequest(1L, List.of(1L, 2L, 3L), null, null)));
        assertEquals(2, scoring.score(q, new AnswerRequest(1L, List.of(1L, 2L), null, null)));
        assertEquals(1, scoring.score(q, new AnswerRequest(1L, List.of(1L, 2L, 4L), null, null)));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, List.of(4L, 5L), null, null)));
    }

    @Test
    void matchingScoresEachPair() {
        Question q = question(QuestionType.MATCHING,
                Option.builder().id(1L).optionText("Хмельниччина").matchKey("1648").build(),
                Option.builder().id(2L).optionText("Люблінська унія").matchKey("1569").build(),
                Option.builder().id(3L).optionText("Берестейська унія").matchKey("1596").build());
        assertEquals(3, scoring.maxScore(q));
        assertEquals(3, scoring.score(q,
                new AnswerRequest(1L, null, Map.of(1L, "1648", 2L, "1569", 3L, "1596"), null)));
        assertEquals(1, scoring.score(q,
                new AnswerRequest(1L, null, Map.of(1L, "1648", 2L, "1596", 3L, "1569"), null)));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, null, null, null)));
    }

    @Test
    void chronologyRequiresExactOrder() {
        Question q = question(QuestionType.CHRONOLOGY,
                Option.builder().id(10L).optionText("c").orderIndex(3).build(),
                Option.builder().id(11L).optionText("a").orderIndex(1).build(),
                Option.builder().id(12L).optionText("b").orderIndex(2).build());
        assertEquals(1, scoring.maxScore(q));
        assertEquals(1, scoring.score(q, new AnswerRequest(1L, null, null, List.of(11L, 12L, 10L))));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, null, null, List.of(10L, 11L, 12L))));
    }

    @Test
    void fillBlankScoresEachBlankWithAlternatives() {
        Question q = question(QuestionType.FILL_BLANK,
                Option.builder().id(1L).optionText("Київ").orderIndex(0).isCorrect(true).build(),
                Option.builder().id(2L).optionText("Kiev").orderIndex(0).isCorrect(true).build(),
                Option.builder().id(3L).optionText("882").orderIndex(1).isCorrect(true).build());
        assertEquals(2, scoring.maxScore(q));
        assertEquals(2, scoring.score(q, new AnswerRequest(1L, null, null, null, List.of("київ", "882"), null)));
        assertEquals(1, scoring.score(q, new AnswerRequest(1L, null, null, null, List.of("Kiev", "999"), null)));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, null, null, null, List.of("", ""), null)));
    }

    @Test
    void fillBlankRespectsCaseSensitivity() {
        Question q = question(QuestionType.FILL_BLANK,
                Option.builder().id(1L).optionText("UNESCO").orderIndex(0).isCorrect(true).build());
        q.setCaseSensitive(true);
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, null, null, null, List.of("unesco"), null)));
        assertEquals(1, scoring.score(q, new AnswerRequest(1L, null, null, null, List.of("UNESCO"), null)));
    }

    @Test
    void openNeedsManualGradingAndScoresZero() {
        Question q = question(QuestionType.OPEN);
        q.setMaxPoints(5);
        assertEquals(5, scoring.maxScore(q));
        assertTrue(scoring.needsManualGrading(q));
        assertEquals(0, scoring.score(q, new AnswerRequest(1L, null, null, null, null, "довга відповідь")));
    }
}
