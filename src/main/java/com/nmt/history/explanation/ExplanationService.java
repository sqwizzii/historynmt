package com.nmt.history.explanation;

import com.nmt.history.dto.QuestionReview;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ForbiddenException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.AnswerVisibilityMode;
import com.nmt.history.model.AttemptAnswer;
import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import com.nmt.history.model.Test;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.AiExplanationRepository;
import com.nmt.history.repository.AttemptAnswerRepository;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.TestAttemptRepository;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.ReviewService;
import com.nmt.history.service.ScoringService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Пояснення до неправильної відповіді: спершу пояснення з матеріалів питання (його додає вчитель), далі збережене
 * в БД раніше (таблиця ai_explanations лишилась як архів; нові пояснення не генеруються). Пояснення розкриває правильну
 * відповідь, тож підпорядковується режиму показу тесту: сервер віддає його лише в дозволений момент.
 */
@Service
@RequiredArgsConstructor
public class ExplanationService {

    private final AiExplanationRepository storedExplanations;
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final TestAttemptRepository attemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final TestResultRepository resultRepository;
    private final UserRepository userRepository;
    private final AccessPolicy accessPolicy;
    private final ReviewService reviewService;
    private final ScoringService scoringService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public ExplanationResponse find(Long testId, Long questionId, String username) {
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено"));
        Test test = testRepository.findById(testId).orElseThrow(() -> new ResourceNotFoundException("Тест не знайдено"));
        accessPolicy.requireView(test.getOwner() == null ? null : test.getOwner().getId(), student);
        if (test.getAnswerVisibilityMode() == AnswerVisibilityMode.NEVER) {
            throw new ForbiddenException("Для цього тесту пояснення не показуються");
        }
        Question question = questionRepository.findById(questionId).filter(q -> q.getTest().getId().equals(testId))
                .orElseThrow(() -> new ResourceNotFoundException("Питання не знайдено"));

        QuestionReview item = studentReview(test, student, question)
                .orElseThrow(() -> new ForbiddenException("Пояснення доступне після вашої відповіді в дозволений момент"));
        if (item.earned() >= item.max()) {
            return ExplanationResponse.of("NOT_NEEDED");
        }
        if (question.getExplanation() != null && !question.getExplanation().isBlank()) {
            return new ExplanationResponse("TEACHER", question.getExplanation());
        }
        String answerHash = answerHash(question.getQuestionType().name(), item.yourAnswer());
        return storedExplanations.findByQuestionIdAndContentHashAndAnswerHash(questionId, contentHash(question), answerHash)
                .map(stored -> new ExplanationResponse("STORED", stored.getExplanation()))
                .orElseGet(() -> ExplanationResponse.of("NONE"));
    }

    /** Відповідь учня на це питання, яку вже дозволено розкривати: перевірена в поточній спробі (AFTER_EACH) або здана. */
    private Optional<QuestionReview> studentReview(Test test, User student, Question question) {
        if (test.getAnswerVisibilityMode() == AnswerVisibilityMode.AFTER_EACH_QUESTION) {
            Optional<AttemptAnswer> locked = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), test.getId())
                    .flatMap(attempt -> attemptAnswerRepository.findByAttemptIdAndQuestionId(attempt.getId(), question.getId()));
            if (locked.isPresent()) {
                return Optional.of(reviewOfLocked(question, locked.get()));
            }
        }
        return resultRepository.findFirstByStudentIdAndTestIdOrderByCompletedAtDesc(student.getId(), test.getId())
                .map(TestResult::getReviewJson).map(reviewService::fromJson)
                .flatMap(list -> list.stream().filter(r -> r.questionId().equals(question.getId())).findFirst());
    }

    private QuestionReview reviewOfLocked(Question question, AttemptAnswer locked) {
        try {
            var answer = objectMapper.readValue(locked.getAnswerJson(), com.nmt.history.dto.AnswerRequest.class);
            int max = scoringService.maxScore(question);
            return reviewService.build(question, answer, Math.min(scoringService.score(question, answer), max), max);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new BadRequestException("Не вдалося прочитати збережену відповідь");
        }
    }

    public static String answerHash(String questionType, java.util.List<String> yourAnswer) {
        return sha256(questionType + "|" + String.join("\u0001", yourAnswer));
    }

    public String contentHash(Question q) {
        StringBuilder sb = new StringBuilder().append(q.getQuestionText()).append('|').append(q.getQuestionType());
        q.getOptions().stream().sorted(Comparator.comparing(Option::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .forEach(o -> sb.append('|').append(o.getOptionText()).append('/').append(o.getIsCorrect()).append('/')
                        .append(o.getMatchKey()).append('/').append(o.getOrderIndex()));
        return sha256(sb.toString());
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
