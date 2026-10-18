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
    private final com.nmt.history.repository.TestAssignmentRepository assignmentRepository;
    private final com.nmt.history.repository.AttemptAnswerRepository attemptAnswerRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    private static final int DEFAULT_TIME_LIMIT_MINUTES = 60;

    @Transactional(readOnly = true)
    public List<TestSummaryResponse> getAllTests(String username) {
        return getAllTests(username, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<TestSummaryResponse> getAllTests(String username, String query, Long subjectId, Integer grade,
                                                 String topic, String type) {
        User actor = accessPolicy.actor(username);
        Long ownerId = accessPolicy.visibleOwnerId(actor);
        List<Test> tests = ownerId == null
                ? testRepository.findByOwnerIsNullOrderByCreatedAtDesc()
                : testRepository.findVisible(ownerId);
        if (actor != null && actor.getRole() == com.nmt.history.model.Role.STUDENT) {
            java.util.Set<Long> restricted = assignmentRepository.findRestrictedTestIds();
            java.util.Set<Long> mine = assignmentRepository.findTestIdsByStudent(actor.getId());
            tests = tests.stream()
                    .filter(t -> ownerId(t) == null || !restricted.contains(t.getId()) || mine.contains(t.getId()))
                    .toList();
        }
        Map<Long, Long> counts = new HashMap<>();
        testRepository.countQuestions().forEach(c -> counts.put(c.getTestId(), c.getTotal()));
        String q = query == null ? "" : query.trim().toLowerCase();
        String topicFilter = topic == null ? "" : topic.trim().toLowerCase();
        QuestionType typeFilter = parseType(type);
        return tests.stream()
                .filter(t -> subjectId == null || (t.getSubject() != null && subjectId.equals(t.getSubject().getId())))
                .filter(t -> grade == null || grade.equals(t.getGrade()))
                .filter(t -> q.isEmpty() || containsIgnoreCase(t.getTitle(), q) || containsIgnoreCase(t.getDescription(), q))
                .filter(t -> topicFilter.isEmpty() || hasTopic(t.getId(), topicFilter))
                .filter(t -> typeFilter == null || hasQuestionType(t.getId(), typeFilter))
                .map(t -> TestSummaryResponse.from(t, counts.getOrDefault(t.getId(), 0L),
                        accessPolicy.canEdit(ownerId(t), actor)))
                .toList();
    }

    private static QuestionType parseType(String type) {
        if (type == null || type.isBlank()) {
            return null;
        }
        try {
            return QuestionType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Невідомий тип матеріалу: " + type);
        }
    }

    private boolean hasTopic(Long testId, String topicFilter) {
        return questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .anyMatch(q -> q.getTopic() != null && q.getTopic().toLowerCase().contains(topicFilter));
    }

    private boolean hasQuestionType(Long testId, QuestionType type) {
        return questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .anyMatch(q -> q.getQuestionType() == type);
    }

    private static boolean containsIgnoreCase(String value, String needle) {
        return value != null && value.toLowerCase().contains(needle);
    }

    @Transactional(readOnly = true)
    public TestDetailResponse getTest(Long testId, String username) {
        Test test = findTest(testId);
        User viewer = accessPolicy.actor(username);
        accessPolicy.requireView(ownerId(test), viewer);
        requireAssigned(test, viewer);
        requireAvailability(test, viewer);
        List<QuestionResponse> questions = questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .map(q -> toQuestionResponse(q, test))
                .collect(Collectors.toCollection(ArrayList::new));
        if (test.isShuffleQuestions() && viewer != null && viewer.getRole() == com.nmt.history.model.Role.STUDENT) {
            Collections.shuffle(questions);
        }
        return new TestDetailResponse(test.getId(), test.getTitle(), test.getDescription(),
                test.getTimeLimitMinutes(), test.getCreatedAt(), subjectId(test), test.getGrade(),
                test.getScoringScale(), test.getAnswerVisibilityMode(),
                test.isShuffleQuestions(), test.isShuffleOptions(), test.getMaxAttempts(),
                test.getAvailableFrom(), test.getAvailableUntil(), questions);
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
                test.getScoringScale(), test.getAnswerVisibilityMode(),
                test.isShuffleQuestions(), test.isShuffleOptions(), test.getMaxAttempts(),
                test.getAvailableFrom(), test.getAvailableUntil(), questions);
    }

    @Transactional
    public TestSummaryResponse createTest(CreateTestRequest request, String username) {
        User actor = accessPolicy.requireActor(username);
        User owner = accessPolicy.ownerForNew(actor);
        validateAvailabilityWindow(request.availableFrom(), request.availableUntil());
        Test test = testRepository.save(Test.builder()
                .title(request.title().trim())
                .description(blankToNull(request.description()))
                .timeLimitMinutes(timeLimit(request))
                .owner(owner)
                .subject(resolveSubject(request.subjectId()))
                .grade(request.grade())
                .scoringScale(request.scoringScale() != null ? request.scoringScale() : ScoringScale.NMT)
                .answerVisibilityMode(request.answerVisibilityMode() != null
                        ? request.answerVisibilityMode() : com.nmt.history.model.AnswerVisibilityMode.AFTER_TEST_COMPLETION)
                .shuffleQuestions(Boolean.TRUE.equals(request.shuffleQuestions()))
                .shuffleOptions(Boolean.TRUE.equals(request.shuffleOptions()))
                .maxAttempts(request.maxAttempts())
                .availableFrom(request.availableFrom())
                .availableUntil(request.availableUntil())
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
        if (request.answerVisibilityMode() != null) {
            test.setAnswerVisibilityMode(request.answerVisibilityMode());
        }
        if (request.shuffleQuestions() != null) {
            test.setShuffleQuestions(request.shuffleQuestions());
        }
        if (request.shuffleOptions() != null) {
            test.setShuffleOptions(request.shuffleOptions());
        }
        if (Boolean.TRUE.equals(request.clearMaxAttempts())) {
            test.setMaxAttempts(null);
        } else if (request.maxAttempts() != null) {
            test.setMaxAttempts(request.maxAttempts());
        }
        if (Boolean.TRUE.equals(request.clearAvailability())) {
            test.setAvailableFrom(null);
            test.setAvailableUntil(null);
        } else {
            LocalDateTime from = request.availableFrom() != null ? request.availableFrom() : test.getAvailableFrom();
            LocalDateTime until = request.availableUntil() != null ? request.availableUntil() : test.getAvailableUntil();
            if (request.availableFrom() != null || request.availableUntil() != null) {
                validateAvailabilityWindow(
                        request.availableFrom() != null ? request.availableFrom() : from,
                        request.availableUntil() != null ? request.availableUntil() : until);
                if (request.availableFrom() != null) {
                    test.setAvailableFrom(request.availableFrom());
                }
                if (request.availableUntil() != null) {
                    test.setAvailableUntil(request.availableUntil());
                }
            }
        }
        return TestSummaryResponse.from(test, test.getQuestions().size(), true);
    }

    @Transactional
    public TestSummaryResponse copyTest(Long testId, String username) {
        User actor = accessPolicy.requireActor(username);
        Test source = findTest(testId);
        accessPolicy.requireView(ownerId(source), actor);
        User owner = accessPolicy.ownerForNew(actor);
        Test copy = testRepository.save(Test.builder()
                .title(source.getTitle() + " (копія)")
                .description(source.getDescription())
                .timeLimitMinutes(source.getTimeLimitMinutes())
                .owner(owner)
                .subject(source.getSubject())
                .grade(source.getGrade())
                .scoringScale(source.getScoringScale())
                .answerVisibilityMode(source.getAnswerVisibilityMode())
                .shuffleQuestions(source.isShuffleQuestions())
                .shuffleOptions(source.isShuffleOptions())
                .maxAttempts(source.getMaxAttempts())
                .availableFrom(source.getAvailableFrom())
                .availableUntil(source.getAvailableUntil())
                .build());
        for (Question q : questionRepository.findByTestIdOrderByIdAsc(testId)) {
            copyQuestionInto(copy, q);
        }
        return TestSummaryResponse.from(copy, copy.getQuestions().size(), true);
    }

    @Transactional
    public QuestionEditResponse copyQuestionToTest(Long targetTestId, Long sourceQuestionId, String username) {
        Test target = findTest(targetTestId);
        accessPolicy.requireEdit(ownerId(target), accessPolicy.actor(username));
        Question source = findQuestion(sourceQuestionId);
        accessPolicy.requireView(ownerId(source.getTest()), accessPolicy.actor(username));
        Question copied = copyQuestionInto(target, source);
        return toQuestionEditResponse(questionRepository.save(copied));
    }

    private Question copyQuestionInto(Test target, Question source) {
        Question q = Question.builder()
                .test(target)
                .questionText(source.getQuestionText())
                .imageUrl(source.getImageUrl())
                .questionType(source.getQuestionType())
                .explanation(source.getExplanation())
                .topic(source.getTopic())
                .maxPoints(source.getMaxPoints())
                .caseSensitive(source.isCaseSensitive())
                .build();
        for (Option o : source.getOptions()) {
            q.addOption(Option.builder()
                    .optionText(o.getOptionText())
                    .isCorrect(o.getIsCorrect())
                    .matchKey(o.getMatchKey())
                    .orderIndex(o.getOrderIndex())
                    .imageUrl(o.getImageUrl())
                    .build());
        }
        int pos = 1;
        for (var img : source.getExtraImages()) {
            q.getExtraImages().add(com.nmt.history.model.QuestionImage.builder()
                    .question(q).position(pos++).imageUrl(img.getImageUrl()).build());
        }
        pos = 1;
        for (var choice : source.getExtraMatchChoices()) {
            q.getExtraMatchChoices().add(com.nmt.history.model.QuestionMatchChoice.builder()
                    .question(q).position(pos++).text(choice.getText()).build());
        }
        target.addQuestion(q);
        return q;
    }

    @Transactional
    public void deleteTest(Long testId, String username) {
        Test test = findTest(testId);
        accessPolicy.requireEdit(ownerId(test), accessPolicy.actor(username));
        testResultRepository.deleteByTestId(testId);
        assignmentRepository.deleteByTestId(testId);
        testRepository.delete(test);
    }

    /** Тест із призначеннями бачать лише призначені учні (власник і адміністратор не обмежуються); для решти він не існує. */
    private void requireAssigned(Test test, User actor) {
        if (actor == null || actor.getRole() != com.nmt.history.model.Role.STUDENT || ownerId(test) == null) {
            return;
        }
        if (assignmentRepository.existsByTestId(test.getId())
                && !assignmentRepository.existsByTestIdAndStudentId(test.getId(), actor.getId())) {
            throw new ResourceNotFoundException("Тест не знайдено: " + test.getId());
        }
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
        validateExtras(request);

        Question question = Question.builder().test(test).build();
        applyQuestion(question, request, Map.of());
        return toQuestionEditResponse(questionRepository.save(question));
    }

    @Transactional
    public QuestionEditResponse updateQuestion(Long questionId, CreateQuestionRequest request, String username) {
        Question question = findQuestion(questionId);
        accessPolicy.requireEdit(ownerId(question.getTest()), accessPolicy.actor(username));
        validateOptions(request.questionType(), request.options());
        validateExtras(request);

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
        if (request.maxPoints() != null) {
            question.setMaxPoints(request.maxPoints());
        } else if (request.questionType() == QuestionType.OPEN && question.getMaxPoints() == null) {
            question.setMaxPoints(1);
        }
        if (request.caseSensitive() != null) {
            question.setCaseSensitive(request.caseSensitive());
        }
        if (request.extraImageUrls() != null) {
            question.getExtraImages().clear();
            int position = 1;
            for (String url : request.extraImageUrls()) {
                question.getExtraImages().add(com.nmt.history.model.QuestionImage.builder().question(question)
                        .position(position++).imageUrl(url.trim()).build());
            }
        }
        if (request.questionType() != QuestionType.MATCHING) {
            question.getExtraMatchChoices().clear();
        } else if (request.extraMatchChoices() != null) {
            question.getExtraMatchChoices().clear();
            int position = 1;
            for (String choice : request.extraMatchChoices()) {
                question.getExtraMatchChoices().add(com.nmt.history.model.QuestionMatchChoice.builder().question(question)
                        .position(position++).text(choice.trim()).build());
            }
        }
        List<OptionRequest> options = request.options() == null ? List.of() : request.options();
        for (OptionRequest o : options) {
            question.addOption(Option.builder()
                    .optionText(o.optionText().trim())
                    .isCorrect(Boolean.TRUE.equals(o.isCorrect())
                            || request.questionType() == QuestionType.FILL_BLANK)
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
        User student = userRepository.findByUsernameForUpdate(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
        accessPolicy.requireView(ownerId(test), student);
        requireAssigned(test, student);
        requireAvailability(test, student);
        if (questionRepository.findByTestIdOrderByIdAsc(testId).isEmpty()) {
            throw new BadRequestException("У тесті немає питань");
        }
        TestAttempt attempt = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), testId)
                .filter(existing -> LocalDateTime.now().isBefore(existing.getStartedAt().plus(limit(test)).plus(SUBMIT_GRACE)))
                .orElse(null);
        if (attempt == null) {
            enforceMaxAttempts(test, student);
            attemptRepository.deleteByStudentIdAndTestId(student.getId(), testId);
            attempt = attemptRepository.save(TestAttempt.builder()
                    .student(student).test(test).startedAt(LocalDateTime.now()).build());
        }
        return toResponse(attempt, test);
    }

    private void enforceMaxAttempts(Test test, User student) {
        if (test.getMaxAttempts() == null) {
            return;
        }
        long completed = testResultRepository.countByStudentIdAndTestId(student.getId(), test.getId());
        if (completed >= test.getMaxAttempts()) {
            throw new BadRequestException("Вичерпано ліміт спроб для цього тесту (" + test.getMaxAttempts() + ")");
        }
    }

    private void requireAvailability(Test test, User actor) {
        if (actor == null || actor.getRole() != com.nmt.history.model.Role.STUDENT) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        if (test.getAvailableFrom() != null && now.isBefore(test.getAvailableFrom())) {
            throw new BadRequestException("Тест ще недоступний. Початок доступу: " + test.getAvailableFrom());
        }
        if (test.getAvailableUntil() != null && now.isAfter(test.getAvailableUntil())) {
            throw new BadRequestException("Доступ до тесту закрито з " + test.getAvailableUntil());
        }
    }

    private static void validateAvailabilityWindow(LocalDateTime from, LocalDateTime until) {
        if (from != null && until != null && until.isBefore(from)) {
            throw new BadRequestException("Дата завершення доступу не може бути раніше дати початку");
        }
    }

    @Transactional
    public AttemptResponse recordLeave(Long testId, String username) {
        User student = findStudent(username);
        Test viewed = findTest(testId);
        accessPolicy.requireView(ownerId(viewed), student);
        requireAssigned(viewed, student);
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
        List<QuestionReview> checked = null;
        List<AnswerRequest> locked = null;
        if (test.getAnswerVisibilityMode() == com.nmt.history.model.AnswerVisibilityMode.AFTER_EACH_QUESTION) {
            Map<Long, Question> byId = new HashMap<>();
            questionRepository.findByTestIdOrderByIdAsc(test.getId()).forEach(q -> byId.put(q.getId(), q));
            List<com.nmt.history.model.AttemptAnswer> stored = attemptAnswerRepository.findByAttemptId(attempt.getId()).stream()
                    .filter(a -> byId.containsKey(a.getQuestionId())).toList();
            checked = reviewService.withSignedImages(stored.stream()
                    .map(a -> reviewOf(byId.get(a.getQuestionId()), readAnswer(a))).toList());
            locked = stored.stream().map(this::readAnswer).toList();
        }
        return new AttemptResponse(attempt.getId(), Math.max(0, limit(test).toSeconds() - elapsed), attempt.getLeaveCount(),
                checked, locked);
    }

    private User findStudent(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
    }

    /** Перевірка однієї відповіді для режиму AFTER_EACH_QUESTION. Після перевірки відповідь фіксується на сервері. */
    @Transactional
    public QuestionReview checkAnswer(Long testId, Long questionId, AnswerRequest request, String username) {
        Test test = findTest(testId);
        User student = findStudent(username);
        accessPolicy.requireView(ownerId(test), student);
        requireAssigned(test, student);
        if (test.getAnswerVisibilityMode() != com.nmt.history.model.AnswerVisibilityMode.AFTER_EACH_QUESTION) {
            throw new com.nmt.history.exception.ForbiddenException("У цьому тесті відповіді не показуються після кожного питання");
        }
        TestAttempt attempt = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), testId)
                .orElseThrow(() -> new BadRequestException("Тест не розпочато. Відкрийте його заново."));
        if (!LocalDateTime.now().isBefore(attempt.getStartedAt().plus(limit(test)).plus(SUBMIT_GRACE))) {
            throw new BadRequestException("Час на тест вичерпано");
        }
        Question question = questionRepository.findById(questionId)
                .filter(q -> q.getTest().getId().equals(testId))
                .orElseThrow(() -> new ResourceNotFoundException("Питання не знайдено: " + questionId));
        AnswerRequest locked = attemptAnswerRepository.findByAttemptIdAndQuestionId(attempt.getId(), questionId)
                .map(this::readAnswer).orElse(null);
        AnswerRequest answer = locked != null ? locked
                : new AnswerRequest(questionId, request.selectedOptionIds(), request.matches(),
                        request.orderedOptionIds(), request.blankAnswers(), request.textAnswer());
        if (locked == null) {
            try {
                attemptAnswerRepository.saveAndFlush(com.nmt.history.model.AttemptAnswer.builder()
                        .attempt(attempt).questionId(questionId).answerJson(writeAnswer(answer)).build());
            } catch (org.springframework.dao.DataIntegrityViolationException e) {
                throw new com.nmt.history.exception.ConflictException("Відповідь уже зафіксовано. Повторіть запит");
            }
        }
        return reviewService.withSignedImages(List.of(reviewOf(question, answer))).get(0);
    }

    private QuestionReview reviewOf(Question question, AnswerRequest answer) {
        int max = scoringService.maxScore(question);
        int earned = scoringService.needsManualGrading(question)
                ? 0
                : Math.min(scoringService.score(question, answer), max);
        return reviewService.build(question, answer, earned, max);
    }

    private String writeAnswer(AnswerRequest answer) {
        try {
            return objectMapper.writeValueAsString(answer);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Не вдалося зберегти відповідь", e);
        }
    }

    private AnswerRequest readAnswer(com.nmt.history.model.AttemptAnswer stored) {
        try {
            return objectMapper.readValue(stored.getAnswerJson(), AnswerRequest.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("Пошкоджена збережена відповідь", e);
        }
    }

    @Transactional
    public TestResultResponse submitTest(Long testId, String username, TestSubmitRequest request) {
        Test test = findTest(testId);
        User student = findStudent(username);
        accessPolicy.requireView(ownerId(test), student);
        requireAssigned(test, student);
        TestAttempt attempt = attemptRepository.findFirstByStudentIdAndTestIdOrderByIdDesc(student.getId(), testId)
                .orElseThrow(() -> new BadRequestException("Тест не розпочато. Відкрийте його заново."));

        List<Question> questions = questionRepository.findByTestIdOrderByIdAsc(testId);
        if (questions.isEmpty()) {
            throw new BadRequestException("У тесті немає питань");
        }

        Map<Long, AnswerRequest> answersByQuestion = indexAnswers(questions, request);
        attemptAnswerRepository.findByAttemptId(attempt.getId())
                .forEach(locked -> answersByQuestion.put(locked.getQuestionId(), readAnswer(locked)));

        int score = 0;
        int maxScore = 0;
        int pendingManual = 0;
        List<QuestionReview> review = new ArrayList<>();
        for (Question question : questions) {
            AnswerRequest answer = answersByQuestion.get(question.getId());
            int questionMax = scoringService.maxScore(question);
            boolean manual = scoringService.needsManualGrading(question);
            int earned = manual ? 0 : Math.min(scoringService.score(question, answer), questionMax);
            maxScore += questionMax;
            score += earned;
            if (manual) {
                pendingManual++;
            }
            review.add(reviewService.build(question, answer, earned, questionMax));
        }

        com.nmt.history.model.GradingStatus gradingStatus = pendingManual > 0
                ? com.nmt.history.model.GradingStatus.PENDING_REVIEW
                : com.nmt.history.model.GradingStatus.COMPLETED;
        TestResult saved = testResultRepository.save(TestResult.builder()
                .student(student)
                .test(test)
                .score(score)
                .nmtScore(test.getScoringScale() == ScoringScale.NMT && pendingManual == 0
                        ? nmtScoreConverter.convert(score, maxScore) : null)
                .reviewJson(reviewService.toJson(review))
                .late(LocalDateTime.now().isAfter(attempt.getStartedAt().plus(limit(test)).plus(SUBMIT_GRACE)))
                .leaveCount(attempt.getLeaveCount())
                .endReason(request.endReason() == null ? "MANUAL" : request.endReason())
                .gradingStatus(gradingStatus)
                .pendingManualCount(pendingManual)
                .build());
        attemptRepository.delete(attempt);
        boolean hide = test.getAnswerVisibilityMode() == com.nmt.history.model.AnswerVisibilityMode.NEVER
                && student.getRole() == com.nmt.history.model.Role.STUDENT;
        List<QuestionReview> visible = hide ? reviewService.hideAnswers(review) : review;
        return TestResultResponse.from(saved, maxScore, reviewService.withSignedImages(visible));
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
        List<OptionRequest> opts = options == null ? List.of() : options;
        long correctCount = opts.stream().filter(o -> Boolean.TRUE.equals(o.isCorrect())).count();

        switch (type) {
            case SINGLE_CHOICE -> {
                if (opts.size() < 2) {
                    throw new BadRequestException("SINGLE_CHOICE потребує щонайменше 2 варіантів");
                }
                if (correctCount != 1) {
                    throw new BadRequestException("SINGLE_CHOICE повинен мати рівно один правильний варіант");
                }
            }
            case MULTIPLE_CHOICE -> {
                if (opts.size() < 2) {
                    throw new BadRequestException("MULTIPLE_CHOICE потребує щонайменше 2 варіантів");
                }
                if (correctCount < 1) {
                    throw new BadRequestException("MULTIPLE_CHOICE повинен мати щонайменше один правильний варіант");
                }
            }
            case MATCHING -> {
                if (opts.size() < 2) {
                    throw new BadRequestException("MATCHING потребує щонайменше 2 пар");
                }
                if (opts.stream().anyMatch(o -> o.matchKey() == null || o.matchKey().isBlank())) {
                    throw new BadRequestException("Кожен варіант MATCHING повинен мати matchKey");
                }
            }
            case CHRONOLOGY -> {
                if (opts.size() < 2) {
                    throw new BadRequestException("CHRONOLOGY потребує щонайменше 2 подій");
                }
                Set<Integer> indexes = new HashSet<>();
                for (OptionRequest o : opts) {
                    if (o.orderIndex() == null || !indexes.add(o.orderIndex())) {
                        throw new BadRequestException(
                                "Кожна подія CHRONOLOGY повинна мати унікальний orderIndex");
                    }
                }
            }
            case FILL_BLANK -> {
                if (opts.isEmpty()) {
                    throw new BadRequestException("FILL_BLANK потребує щонайменше одну еталонну відповідь");
                }
                for (OptionRequest o : opts) {
                    if (o.optionText() == null || o.optionText().isBlank()) {
                        throw new BadRequestException("Еталонна відповідь FILL_BLANK не може бути порожньою");
                    }
                    if (o.orderIndex() == null || o.orderIndex() < 0) {
                        throw new BadRequestException("Кожна відповідь FILL_BLANK повинна мати orderIndex пропуску (≥ 0)");
                    }
                }
            }
            case OPEN -> {
                // Варіанти необов'язкові (зразок відповіді для вчителя). maxPoints перевіряється окремо.
            }
        }
    }

    private static final int MAX_EXTRA_ITEMS = 10;
    private static final java.util.regex.Pattern HTTPS_URL = java.util.regex.Pattern.compile("^https://\\S{1,2000}$");

    /** Додаткові зображення лише за https; зайві варіанти правої колонки лише для MATCHING, унікальні й не збігаються з відповідниками. */
    private void validateExtras(CreateQuestionRequest request) {
        List<String> images = request.extraImageUrls();
        if (images != null) {
            if (images.size() > MAX_EXTRA_ITEMS) {
                throw new BadRequestException("Забагато додаткових зображень (максимум " + MAX_EXTRA_ITEMS + ")");
            }
            for (String url : images) {
                if (url == null || !HTTPS_URL.matcher(url.trim()).matches()) {
                    throw new BadRequestException("Додаткові зображення дозволені лише за https-посиланням");
                }
            }
        }
        List<String> choices = request.extraMatchChoices();
        if (choices == null || choices.isEmpty()) {
            return;
        }
        if (request.questionType() != QuestionType.MATCHING) {
            throw new BadRequestException("Зайві варіанти відповідності доступні лише для питань на відповідність");
        }
        if (choices.size() > MAX_EXTRA_ITEMS) {
            throw new BadRequestException("Забагато зайвих варіантів (максимум " + MAX_EXTRA_ITEMS + ")");
        }
        Set<String> seen = new HashSet<>();
        request.options().forEach(o -> seen.add(normalizeChoice(o.matchKey())));
        for (String choice : choices) {
            if (choice == null || choice.isBlank() || choice.length() > 2000) {
                throw new BadRequestException("Зайвий варіант відповідності не може бути порожнім");
            }
            if (!seen.add(normalizeChoice(choice))) {
                throw new BadRequestException("Зайвий варіант збігається з іншим варіантом правої колонки: " + choice.trim());
            }
        }
    }

    private static String normalizeChoice(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    QuestionResponse toQuestionResponse(Question question) {
        return toQuestionResponse(question, question.getTest());
    }

    QuestionResponse toQuestionResponse(Question question, Test test) {
        List<Option> options = new ArrayList<>(question.getOptions());
        options.sort(Comparator.comparing(Option::getId, Comparator.nullsLast(Comparator.naturalOrder())));

        List<String> matchChoices = null;
        Integer blankCount = null;
        Integer maxPoints = null;
        boolean shuffleOpts = test != null && test.isShuffleOptions();
        if (question.getQuestionType() == QuestionType.MATCHING) {
            matchChoices = options.stream()
                    .map(Option::getMatchKey)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toCollection(ArrayList::new));
            matchChoices.addAll(question.extraMatchChoiceTexts());
            Collections.shuffle(matchChoices);
        } else if (question.getQuestionType() == QuestionType.CHRONOLOGY) {
            Collections.shuffle(options);
        } else if (question.getQuestionType() == QuestionType.FILL_BLANK) {
            blankCount = scoringService.blankIndexes(question).size();
            options = List.of();
        } else if (question.getQuestionType() == QuestionType.OPEN) {
            maxPoints = scoringService.maxScore(question);
            options = List.of();
        } else if (shuffleOpts
                && (question.getQuestionType() == QuestionType.SINGLE_CHOICE
                || question.getQuestionType() == QuestionType.MULTIPLE_CHOICE)) {
            Collections.shuffle(options);
        }

        List<OptionResponse> optionResponses = options.stream()
                .map(o -> new OptionResponse(o.getId(), o.getOptionText(), imageUrlSigner.sign(QuestionImages.publicUrl(o))))
                .toList();
        return new QuestionResponse(question.getId(), question.getQuestionText(),
                imageUrlSigner.sign(QuestionImages.publicUrl(question)), question.extraImageUrls(),
                question.getQuestionType(), optionResponses, matchChoices, blankCount, maxPoints);
    }

    private QuestionEditResponse toQuestionEditResponse(Question question) {
        List<OptionEditResponse> options = question.getOptions().stream()
                .sorted(Comparator.comparing(Option::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(o -> new OptionEditResponse(o.getId(), o.getOptionText(), Boolean.TRUE.equals(o.getIsCorrect()),
                        o.getMatchKey(), o.getOrderIndex(), imageUrlSigner.sign(QuestionImages.publicUrl(o))))
                .toList();
        return new QuestionEditResponse(question.getId(), question.getQuestionText(),
                imageUrlSigner.sign(QuestionImages.publicUrl(question)),
                question.getQuestionType(), question.getExplanation(), question.getTopic(), options,
                question.extraImageUrls(), question.extraMatchChoiceTexts(),
                question.getMaxPoints() == null ? 1 : question.getMaxPoints(),
                question.isCaseSensitive());
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
