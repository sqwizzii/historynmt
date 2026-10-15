package com.nmt.history.service;

import com.nmt.history.dto.AnswerRequest;
import com.nmt.history.dto.MistakesResponse;
import com.nmt.history.dto.PracticeResultResponse;
import com.nmt.history.dto.QuestionResponse;
import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TestSubmitRequest;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.PracticeFix;
import com.nmt.history.model.Question;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.PracticeFixRepository;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Робота над помилками: питання, на які учень востаннє відповів неправильно, і повторне їх проходження. */
@Service
@RequiredArgsConstructor
public class PracticeService {

    private static final int SESSION_SIZE = 20;

    private final UserRepository userRepository;
    private final TestResultRepository testResultRepository;
    private final QuestionRepository questionRepository;
    private final PracticeFixRepository fixRepository;
    private final TestService testService;
    private final ScoringService scoringService;
    private final ReviewService reviewService;
    private final AccessPolicy accessPolicy;

    @Transactional(readOnly = true)
    public MistakesResponse mistakes(String username) {
        User student = findStudent(username);
        List<Long> ids = openMistakeIds(student);
        List<Question> questions = loadQuestions(ids.stream().limit(SESSION_SIZE).toList());
        List<QuestionResponse> responses = questions.stream().map(testService::toQuestionResponse).toList();
        return new MistakesResponse(ids.size(), responses);
    }

    @Transactional
    public PracticeResultResponse check(String username, TestSubmitRequest request) {
        User student = findStudent(username);
        Set<Long> allowed = new HashSet<>(openMistakeIds(student));
        Map<Long, AnswerRequest> answers = new LinkedHashMap<>();
        for (AnswerRequest answer : request.answers()) {
            if (answer == null || !allowed.contains(answer.questionId()) || answers.put(answer.questionId(), answer) != null) {
                throw new BadRequestException("Питання недоступне для роботи над помилками");
            }
        }

        List<QuestionReview> review = new ArrayList<>();
        int fixed = 0;
        for (Question question : loadQuestions(new ArrayList<>(answers.keySet()))) {
            AnswerRequest answer = answers.get(question.getId());
            int max = scoringService.maxScore(question);
            int earned = Math.min(scoringService.score(question, answer), max);
            review.add(reviewService.build(question, answer, earned, max));
            if (earned == max) {
                fixed++;
                PracticeFix fix = fixRepository.findByStudentIdAndQuestionId(student.getId(), question.getId())
                        .orElseGet(() -> new PracticeFix(null, student.getId(), question.getId(), null));
                fix.setFixedAt(LocalDateTime.now());
                fixRepository.save(fix);
            }
        }
        return new PracticeResultResponse(fixed, review.size(), reviewService.withSignedImages(review));
    }

    private List<Long> openMistakeIds(User student) {
        Long studentId = student.getId();
        Map<Long, LocalDateTime> fixedAt = new HashMap<>();
        fixRepository.findByStudentId(studentId).forEach(f -> fixedAt.put(f.getQuestionId(), f.getFixedAt()));

        Set<Long> seen = new HashSet<>();
        List<Long> open = new ArrayList<>();
        for (TestResult result : testResultRepository.findByStudentIdOrderByCompletedAtDesc(studentId)) {
            List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
            if (review == null) {
                continue;
            }
            for (QuestionReview item : review) {
                if (!seen.add(item.questionId())) {
                    continue;
                }
                LocalDateTime fixed = fixedAt.get(item.questionId());
                boolean resolved = fixed != null && fixed.isAfter(result.getCompletedAt());
                if (item.earned() < item.max() && !resolved) {
                    open.add(item.questionId());
                }
            }
        }
        Set<Long> existing = new HashSet<>();
        questionRepository.findAllById(open).stream()
                .filter(q -> accessPolicy.canView(q.getTest().getOwner() == null ? null : q.getTest().getOwner().getId(), student))
                .forEach(q -> existing.add(q.getId()));
        return open.stream().filter(existing::contains).toList();
    }

    private List<Question> loadQuestions(List<Long> ids) {
        Map<Long, Question> byId = new HashMap<>();
        questionRepository.findAllById(ids).forEach(q -> byId.put(q.getId(), q));
        return ids.stream().map(byId::get).filter(java.util.Objects::nonNull).toList();
    }

    private User findStudent(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
    }
}
