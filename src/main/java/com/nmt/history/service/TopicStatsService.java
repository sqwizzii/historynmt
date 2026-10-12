package com.nmt.history.service;

import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TopicStat;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Question;
import com.nmt.history.model.Role;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Успішність учня по темах: за всіма його відповідями на питання з вказаною темою. */
@Service
@RequiredArgsConstructor
public class TopicStatsService {

    private final UserRepository userRepository;
    private final TestResultRepository testResultRepository;
    private final QuestionRepository questionRepository;
    private final ReviewService reviewService;

    private static final class Sum {
        int answered;
        int earned;
        int max;
    }

    @Transactional(readOnly = true)
    public List<TopicStat> forUsername(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
        return compute(user.getId());
    }

    @Transactional(readOnly = true)
    public List<TopicStat> forStudent(Long studentId) {
        userRepository.findById(studentId)
                .filter(user -> user.getRole() == Role.STUDENT)
                .orElseThrow(() -> new ResourceNotFoundException("Учня не знайдено: " + studentId));
        return compute(studentId);
    }

    private List<TopicStat> compute(Long studentId) {
        Map<Long, Sum> byQuestion = new HashMap<>();
        for (TestResult result : testResultRepository.findByStudentIdOrderByCompletedAtDesc(studentId)) {
            List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
            if (review == null) {
                continue;
            }
            for (QuestionReview item : review) {
                Sum sum = byQuestion.computeIfAbsent(item.questionId(), id -> new Sum());
                sum.answered++;
                sum.earned += item.earned();
                sum.max += item.max();
            }
        }

        Set<Long> ids = new HashSet<>(byQuestion.keySet());
        Map<String, Sum> byTopic = new HashMap<>();
        for (Question question : questionRepository.findAllById(ids)) {
            if (question.getTopic() == null) {
                continue;
            }
            Sum source = byQuestion.get(question.getId());
            Sum target = byTopic.computeIfAbsent(question.getTopic(), t -> new Sum());
            target.answered += source.answered;
            target.earned += source.earned;
            target.max += source.max;
        }
        return byTopic.entrySet().stream()
                .map(e -> new TopicStat(e.getKey(), e.getValue().answered,
                        e.getValue().max == 0 ? 0 : (int) Math.round(100.0 * e.getValue().earned / e.getValue().max)))
                .sorted(Comparator.comparingInt(TopicStat::percent).thenComparing(TopicStat::topic))
                .toList();
    }
}
