package com.nmt.history.service;

import com.nmt.history.dto.AnswerRequest;
import com.nmt.history.dto.CreateQuestionRequest;
import com.nmt.history.dto.CreateTestRequest;
import com.nmt.history.dto.OptionRequest;
import com.nmt.history.dto.OptionResponse;
import com.nmt.history.dto.QuestionResponse;
import com.nmt.history.dto.TestDetailResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.dto.TestSubmitRequest;
import com.nmt.history.dto.TestSummaryResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Option;
import com.nmt.history.model.Question;
import com.nmt.history.model.QuestionType;
import com.nmt.history.model.Test;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.TestRepository;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
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
    private final TestResultRepository testResultRepository;
    private final UserRepository userRepository;
    private final ScoringService scoringService;
    private final NmtScoreConverter nmtScoreConverter;

    @Transactional(readOnly = true)
    public List<TestSummaryResponse> getAllTests() {
        return testRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(TestSummaryResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public TestDetailResponse getTest(Long testId) {
        Test test = findTest(testId);
        List<QuestionResponse> questions = questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .map(this::toQuestionResponse)
                .toList();
        return new TestDetailResponse(test.getId(), test.getTitle(), test.getDescription(),
                test.getCreatedAt(), questions);
    }

    @Transactional
    public TestSummaryResponse createTest(CreateTestRequest request) {
        Test test = testRepository.save(Test.builder()
                .title(request.title().trim())
                .description(request.description())
                .build());
        return TestSummaryResponse.from(test);
    }

    @Transactional
    public QuestionResponse createQuestion(CreateQuestionRequest request) {
        Test test = findTest(request.testId());
        validateOptions(request.questionType(), request.options());

        Question question = Question.builder()
                .test(test)
                .questionText(request.questionText().trim())
                .questionType(request.questionType())
                .build();
        for (OptionRequest o : request.options()) {
            question.addOption(Option.builder()
                    .optionText(o.optionText().trim())
                    .isCorrect(Boolean.TRUE.equals(o.isCorrect()))
                    .matchKey(o.matchKey() == null || o.matchKey().isBlank() ? null : o.matchKey().trim())
                    .orderIndex(o.orderIndex())
                    .build());
        }
        return toQuestionResponse(questionRepository.save(question));
    }

    @Transactional
    public TestResultResponse submitTest(Long testId, String username, TestSubmitRequest request) {
        Test test = findTest(testId);
        User student = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));

        List<Question> questions = questionRepository.findByTestIdOrderByIdAsc(testId);
        if (questions.isEmpty()) {
            throw new BadRequestException("У тесті немає питань");
        }

        Map<Long, AnswerRequest> answersByQuestion = indexAnswers(questions, request);

        int score = 0;
        int maxScore = 0;
        for (Question question : questions) {
            int questionMax = scoringService.maxScore(question);
            maxScore += questionMax;
            score += Math.min(scoringService.score(question, answersByQuestion.get(question.getId())), questionMax);
        }

        TestResult saved = testResultRepository.save(TestResult.builder()
                .student(student)
                .test(test)
                .score(score)
                .nmtScore(nmtScoreConverter.convert(score, maxScore))
                .build());
        return TestResultResponse.from(saved, maxScore);
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

    private QuestionResponse toQuestionResponse(Question question) {
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
                .map(o -> new OptionResponse(o.getId(), o.getOptionText()))
                .toList();
        return new QuestionResponse(question.getId(), question.getQuestionText(),
                question.getQuestionType(), optionResponses, matchChoices);
    }

    private Test findTest(Long testId) {
        return testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Тест не знайдено: " + testId));
    }
}
