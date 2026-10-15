package com.nmt.history.service;

import com.nmt.history.dto.AnswerRequest;
import com.nmt.history.dto.AttemptResponse;
import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.CreateTestRequest;
import com.nmt.history.dto.OptionEditResponse;
import com.nmt.history.dto.OptionRequest;
import com.nmt.history.dto.OptionResponse;
import com.nmt.history.dto.QuestionEditResponse;
import com.nmt.history.dto.QuestionResponse;
import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TestDetailResponse;
import com.nmt.history.dto.TestEditResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.dto.TestSubmitRequest;
import com.nmt.history.dto.TestSummaryResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import com.nmt.history.model.ScoringScale;
import com.nmt.history.model.Subject;
import com.nmt.history.model.QuestionType;
import com.nmt.history.model.Test;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.TestAttempt;
import com.nmt.history.model.User;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.SubjectRepository;
import com.nmt.history.repository.TestAttemptRepository;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import java.time.Duration;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TestService {

    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final com.nmt.history.repository.OptionRepository optionRepository;
    private final TestResultRepository testResultRepository;
    private final TestAttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;
    private final NmtScoreConverter nmtScoreConverter;
    private final ReviewService reviewService;
    private final AccessPolicy accessPolicy;
    private final SubjectRepository subjectRepository;
    private final ImageUrlSigner imageUrlSigner;

    private static final int DEFAULT_TIME_LIMIT_MINUTES = 60;

    @Transactional(readOnly = true)
    public List<TestSummaryResponse> getAllTests(String username) {
        User actor = accessPolicy.actor(username);
        Long ownerId = accessPolicy.visibleOwnerId(actor);
        List<Test> tests = ownerId == null
                ? testRepository.findByOwnerIsNullOrderByCreatedAtDesc()
                : testRepository.findVisible(ownerId);
        Map<Long, Long> counts = new HashMap<>();
        testRepository.countQuestions().forEach(c -> counts.put(c.getTestId(), c.getTotal()));
        return tests.stream()
                .map(t -> TestSummaryResponse.from(t, counts.getOrDefault(t.getId(), 0L),
                        accessPolicy.canEdit(ownerId(t), actor)))
                .toList();
    }

    @Transactional(readOnly = true)
    public TestDetailResponse getTest(Long testId, String username) {
        Test test = findTest(testId);
        accessPolicy.requireView(ownerId(test), accessPolicy.actor(username));
        List<QuestionResponse> questions = questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .map(this::toQuestionResponse)
                .toList();
        return new TestDetailResponse(test.getId(), test.getTitle(), test.getDescription(),
                test.getTimeLimitMinutes(), test.getCreatedAt(), subjectId(test), test.getGrade(),
                test.getScoringScale(), questions);
    }

    @Transactional(readOnly = true)
    public TestEditResponse getTestForEdit(Long testId, String username) {
        Test test = findTest(testId);
        accessPolicy.requireEdit(ownerId(test), accessPolicy.actor(username));
        List<QuestionEditResponse> questions = questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .map(this::toQuestionEditResponse)
                .toList();
        return new TestEditResponse(test.getId(), test.getTitle(), test.getDescription(),
                test.getTimeLimitMinutes(), test.getCreatedAt(), subjectId(test), test.getGrade(),
                test.getScoringScale(), questions);
    }

    @Transactional
    public TestSummaryResponse createTest(CreateTestRequest request, String username) {
        User actor = accessPolicy.requireActor(username);
        User owner = accessPolicy.ownerForNew(actor);
        Test test = testRepository.save(Test.builder()
                .title(request.title().trim())
                .description(blankToNull(request.description()))
                .timeLimitMinutes(timeLimit(request))
                .owner(owner)
                .subject(resolveSubject(request.subjectId()))
                .grade(request.grade())
                .scoringScale(request.scoringScale() != null ? request.scoringScale() : ScoringScale.NMT)
                .build());
        return TestSummaryResponse.from(test, 0, true);
    }

    @Transactional
    public TestSummaryResponse updateTest(Long testId, CreateTestRequest request, String username) {
        User actor = accessPolicy.requireActor(username);
        Test test = findTest(testId);
        accessPolicy.requireEdit(ownerId(test), actor);
        test.setTitle(request.title().trim());
        test.setDescription(blankToNull(request.description()));
        test.setTimeLimitMinutes(timeLimit(request));
        if (request.subjectId() != null) {
            test.setSubject(resolveSubject(request.subjectId()));
        }
        if (request.grade() != null) {
            test.setGrade(request.grade());
        }
        if (request.scoringScale() != null) {
            test.setScoringScale(request.scoringScale());
        }
        return TestSummaryResponse.from(test, test.getQuestions().size(), true);
    }

    @Transactional
    public void deleteTest(Long testId, String username) {
        Test test = findTest(testId);
        accessPolicy.requireEdit(ownerId(test), accessPolicy.actor(username));
        testResultRepository.deleteByTestId(testId);
        testRepository.delete(test);
    }

    private Subject resolveSubject(Long subjectId) {
        if (subjectId == null) {
            return null;
        }
        return subjectRepository.findById(subjectId)
                .filter(Subject::isActive)
                .orElseThrow(() -> new BadRequestException("Невідомий предмет: " + subjectId));
    }

    private static Long ownerId(Test test) {
        return test.getOwner() == null ? null : test.getOwner().getId();
    }

    private static Long subjectId(Test test) {
        return test.getSubject() == null ? null : test.getSubject().getId();
    }

    @Transactional
    public QuestionEditResponse createQuestion(CreateQuestionRequest request, String username) {
        Test test = findTest(request.testId());
        accessPolicy.requireEdit(ownerId(test), accessPolicy.actor(username));
        validateOptions(request.questionType(), request.options());

        Question question = Question.builder().test(test).build();
        applyQuestion(question, request, Map.of());
        return toQuestionEditResponse(questionRepository.save(question));
    }

    @Transactional
    public QuestionEditResponse updateQuestion(Long questionId, CreateQuestionRequest request, String username) {
        Question question = findQuestion(questionId);
        accessPolicy.requireEdit(ownerId(question.getTest()), accessPolicy.actor(username));
        validateOptions(request.questionType(), request.options());

        Map<Long, String> previousImages = new HashMap<>();
        question.getOptions().stream().filter(o -> o.getImageUrl() != null)
                .forEach(o -> previousImages.put(o.getId(), o.getImageUrl()));
        question.getOptions().clear();
        applyQuestion(question, request, previousImages);
        return toQuestionEditResponse(questionRepository.save(question));
    }

    @Transactional
    public void deleteQuestion(Long questionId, String username) {
        Question question = findQuestion(questionId);
        accessPolicy.requireEdit(ownerId(question.getTest()), accessPolicy.actor(username));
        questionRepository.delete(question);
    }

    private void applyQuestion(Question question, CreateQuestionRequest request, Map<Long, String> previousImages) {
        question.setQuestionText(request.questionText().trim());
        String imageUrl = blankToNull(request.imageUrl());
        if (imageUrl == null || !QuestionImages.OWN_URL.matcher(imageUrl).matches()) {
            question.setImageUrl(imageUrl);
        }
        question.setExplanation(blankToNull(request.explanation()));
        question.setTopic(blankToNull(request.topic()));
        question.setQuestionType(request.questionType());
        for (OptionRequest o : request.options()) {
            question.addOption(Option.builder()
                    .optionText(o.optionText().trim())
                    .isCorrect(Boolean.TRUE.equals(o.isCorrect()))
                    .matchKey(blankToNull(o.matchKey()))
                    .orderIndex(o.orderIndex())
                    .imageUrl(resolveOptionImage(blankToNull(o.imageUrl()), previousImages))
                    .build());
        }
    }

    private static String resolveOptionImage(String url, Map<Long, String> previousImages) {
        if (url == null) {
            return null;
        }
        var own = QuestionImages.OWN_OPTION_URL.matcher(url);
        return own.matches() ? previousImages.get(Long.parseLong(own.group(1))) : url;
    }

    private int timeLimit(CreateTestRequest request) {
        return request.timeLimitMinutes() != null ? request.timeLimitMinutes() : DEFAULT_TIME_LIMIT_MINUTES;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public AttemptResponse startAttempt(Long testId, String username) {
        Test test = findTest(testId);
        User student = findStudent(username);
        accessPolicy.requireView(ownerId(test), student);
        if (questionRepository.findByTestIdOrderByIdAsc(testId).isEmpty()) {
            throw new BadRequestException("У тесті немає питань");
        }
        TestAttempt attempt = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), testId)
                .filter(existing -> LocalDateTime.now().isBefore(existing.getStartedAt().plus(limit(test)).plus(SUBMIT_GRACE)))
                .orElse(null);
        if (attempt == null) {
            attemptRepository.deleteByStudentIdAndTestId(student.getId(), testId);
            attempt = attemptRepository.save(TestAttempt.builder()
                    .student(student).test(test).startedAt(LocalDateTime.now()).build());
        }
        return toResponse(attempt, test);
    }

    @Transactional
    public AttemptResponse recordLeave(Long testId, String username) {
        User student = findStudent(username);
        accessPolicy.requireView(ownerId(findTest(testId)), student);
        TestAttempt attempt = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), testId)
                .orElseThrow(() -> new BadRequestException("Тест не розпочато"));
        attempt.setLeaveCount(attempt.getLeaveCount() + 1);
        return toResponse(attempt, attempt.getTest());
    }

    private static final Duration SUBMIT_GRACE = Duration.ofSeconds(30);

    private static Duration limit(Test test) {
        return Duration.ofMinutes(test.getTimeLimitMinutes());
    }

    private AttemptResponse toResponse(TestAttempt attempt, Test test) {
        long elapsed = Duration.between(attempt.getStartedAt(), LocalDateTime.now()).toSeconds();
        return new AttemptResponse(Math.max(0, limit(test).toSeconds() - elapsed), attempt.getLeaveCount());
    }

    private User findStudent(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
    }

    @Transactional
    public TestResultResponse submitTest(Long testId, String username, TestSubmitRequest request) {
        Test test = findTest(testId);
        User student = findStudent(username);
        accessPolicy.requireView(ownerId(test), student);
        TestAttempt attempt = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), testId)
                .orElseThrow(() -> new BadRequestException("Тест не розпочато. Відкрийте його заново."));

        List<Question> questions = questionRepository.findByTestIdOrderByIdAsc(testId);
        if (questions.isEmpty()) {
            throw new BadRequestException("У тесті немає питань");
        }

        Map<Long, AnswerRequest> answersByQuestion = indexAnswers(questions, request);

        int score = 0;
        int maxScore = 0;
        List<QuestionReview> review = new ArrayList<>();
        for (Question question : questions) {
            AnswerRequest answer = answersByQuestion.get(question.getId());
            int questionMax = scoringService.maxScore(question);
            int earned = Math.min(scoringService.score(question, answer), questionMax);
            maxScore += questionMax;
            score += earned;
            review.add(reviewService.build(question, answer, earned, questionMax));
        }

        TestResult saved = testResultRepository.save(TestResult.builder()
                .student(student)
                .test(test)
                .score(score)
                .nmtScore(test.getScoringScale() == ScoringScale.NMT ? nmtScoreConverter.convert(score, maxScore) : null)
                .reviewJson(reviewService.toJson(review))
                .late(LocalDateTime.now().isAfter(attempt.getStartedAt().plus(limit(test)).plus(SUBMIT_GRACE)))
                .leaveCount(attempt.getLeaveCount())
                .endReason(request.endReason() == null ? "MANUAL" : request.endReason())
                .build());
        attemptRepository.delete(attempt);
        return TestResultResponse.from(saved, maxScore, reviewService.withSignedImages(review));
    }

    private Map<Long, AnswerRequest> indexAnswers(List<Question> questions, TestSubmitRequest request) {
        Set<Long> questionIds = new HashSet<>();
        questions.forEach(q -> questionIds.add(q.getId()));

        Map<Long, AnswerRequest> byQuestion = new HashMap<>();
        for (AnswerRequest answer : request.answers()) {
            if (answer == null || !questionIds.contains(answer.questionId())) {
                throw new BadRequestException("Питання не належить цьому тесту: "
                        + (answer == null ? null : answer.questionId()));
            }
            if (byQuestion.put(answer.questionId(), answer) != null) {
                throw new BadRequestException("Дубльована відповідь на питання " + answer.questionId());
            }
        }
        return byQuestion;
    }

    private void validateOptions(QuestionType type, List<OptionRequest> options) {
        long correctCount = options.stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count();

        switch (type) {
            case SINGLE_CHOICE -> {
                if (options.size() < 2) {
                    throw new BadRequestException("SINGLE_CHOICE потребує щонайменше 2 варіантів");
                }
                if (correctCount != 1) {
                    throw new BadRequestException("SINGLE_CHOICE повинен мати рівно один правильний варіант");
                }
            }
            case MULTIPLE_CHOICE -> {
                if (options.size() < 2) {
                    throw new BadRequestException("MULTIPLE_CHOICE потребує щонайменше 2 варіантів");
                }
                if (correctCount < 1) {
                    throw new BadRequestException("MULTIPLE_CHOICE повинен мати щонайменше один правильний варіант");
                }
            }
            case MATCHING -> {
                if (options.size() < 2) {
                    throw new BadRequestException("MATCHING потребує щонайменше 2 пар");
                }
                if (options.stream().anyMatch(o -> o.matchKey() == null || o.matchKey().isBlank())) {
                    throw new BadRequestException("Кожен варіант MATCHING повинен мати matchKey");
                }
            }
            case CHRONOLOGY -> {
                if (options.size() < 2) {
                    throw new BadRequestException("CHRONOLOGY потребує щонайменше 2 подій");
                }
                Set<Integer> indexes = new HashSet<>();
                for (OptionRequest o : options) {
                    if (o.orderIndex() == null || !indexes.add(o.orderIndex())) {
                        throw new BadRequestException(
                                "Кожна подія CHRONOLOGY повинна мати унікальний orderIndex");
                    }
                }
            }
        }
    }

    QuestionResponse toQuestionResponse(Question question) {
        List<Option> options = new ArrayList<>(question.getOptions());
        options.sort(Comparator.comparing(Option::getId, Comparator.nullsLast(Comparator.naturalOrder())));

        List<String> matchChoices = null;
        if (question.getQuestionType() == QuestionType.MATCHING) {
            matchChoices = options.stream()
                    .map(Option::getMatchKey)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toCollection(ArrayList::new));
            Collections.shuffle(matchChoices);
        } else if (question.getQuestionType() == QuestionType.CHRONOLOGY) {
            Collections.shuffle(options);
        }

        List<OptionResponse> optionResponses = options.stream()
                .map(o -> new OptionResponse(o.getId(), o.getOptionText(), imageUrlSigner.sign(QuestionImages.publicUrl(o))))
                .toList();
        return new QuestionResponse(question.getId(), question.getQuestionText(),
                imageUrlSigner.sign(QuestionImages.publicUrl(question)), question.getQuestionType(), optionResponses, matchChoices);
    }

    private QuestionEditResponse toQuestionEditResponse(Question question) {
        List<OptionEditResponse> options = question.getOptions().stream()
                .sorted(Comparator.comparing(Option::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(o -> new OptionEditResponse(o.getId(), o.getOptionText(), Boolean.TRUE.equals(o.getIsCorrect()),
                        o.getMatchKey(), o.getOrderIndex(), imageUrlSigner.sign(QuestionImages.publicUrl(o))))
                .toList();
        return new QuestionEditResponse(question.getId(), question.getQuestionText(),
                imageUrlSigner.sign(QuestionImages.publicUrl(question)),
                question.getQuestionType(), question.getExplanation(), question.getTopic(), options);
    }

    /** Системні зображення публічні; зображення приватних матеріалів потребують чинного підпису (інакше 404). */
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> questionImage(Long questionId, String exp, String sig) {
        Question question = findQuestion(questionId);
        boolean isPublic = ownerId(question.getTest()) == null;
        if (!isPublic && !imageUrlSigner.verify("/api/tests/questions/" + questionId + "/image", exp, sig)) {
            throw new ResourceNotFoundException("Зображення не знайдено");
        }
        return imageResponse(question.getImageUrl(), isPublic);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> optionImage(Long optionId, String exp, String sig) {
        Option option = optionRepository.findById(optionId)
                .orElseThrow(() -> new ResourceNotFoundException("Варіант не знайдено: " + optionId));
        boolean isPublic = ownerId(option.getQuestion().getTest()) == null;
        if (!isPublic && !imageUrlSigner.verify("/api/tests/options/" + optionId + "/image", exp, sig)) {
            throw new ResourceNotFoundException("Зображення не знайдено");
        }
        return imageResponse(option.getImageUrl(), isPublic);
    }

    private ResponseEntity<byte[]> imageResponse(String url, boolean isPublic) {
        if (url == null || !url.startsWith("data:")) {
            throw new ResourceNotFoundException("Зображення не знайдено");
        }
        String mime = url.substring(5, url.indexOf(';'));
        byte[] bytes = java.util.Base64.getDecoder().decode(url.substring(url.indexOf(',') + 1));
        return ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(mime))
                .cacheControl(isPublic
                        ? org.springframework.http.CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePublic()
                        : org.springframework.http.CacheControl.maxAge(java.time.Duration.ofMinutes(5)).cachePrivate())
                .body(bytes);
    }

    private Question findQuestion(Long questionId) {
        return questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Питання не знайдено: " + questionId));
    }

    private Test findTest(Long testId) {
        return testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Тест не знайдено: " + testId));
    }
}
