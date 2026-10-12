package com.nmt.history.service;

import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TestStatsResponse;
import com.nmt.history.dto.TestStatsResponse.QuestionStat;
import com.nmt.history.model.Question;
import com.nmt.history.model.TestResult;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.TestResultRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Статистика по питаннях тесту для вчителя: на що учні помиляються найчастіше. */
@Service
@RequiredArgsConstructor
public class TestStatsService {

    private final TestResultRepository testResultRepository;
    private final QuestionRepository questionRepository;
    private final ReviewService reviewService;

    private static final class Counter {
        int answered;
        int wrong;
        int earned;
        int max;
    }

    @Transactional(readOnly = true)
    public TestStatsResponse stats(Long testId) {
        List<TestResult> results = testResultRepository.findByTestId(testId);
        Map<Long, Counter> counters = new HashMap<>();
        for (TestResult result : results) {
            List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
            if (review == null) {
                continue;
            }
            for (QuestionReview item : review) {
                Counter counter = counters.computeIfAbsent(item.questionId(), id -> new Counter());
                counter.answered++;
                counter.earned += item.earned();
                counter.max += item.max();
                if (item.earned() < item.max()) {
                    counter.wrong++;
                }
            }
        }

        List<QuestionStat> stats = questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .filter(q -> counters.containsKey(q.getId()))
                .map(q -> toStat(q, counters.get(q.getId())))
                .sorted(Comparator.comparingInt(QuestionStat::correctPercent))
                .toList();
        return new TestStatsResponse(results.size(), stats);
    }

    private QuestionStat toStat(Question question, Counter counter) {
        int percent = counter.max == 0 ? 0 : (int) Math.round(100.0 * counter.earned / counter.max);
        return new QuestionStat(question.getId(), question.getQuestionText(), counter.answered, counter.wrong, percent);
    }
}
