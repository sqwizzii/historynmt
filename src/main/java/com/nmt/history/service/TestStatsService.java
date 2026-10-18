package com.nmt.history.service;

import com.nmt.history.dto.AnalyticsSummaryResponse;
import com.nmt.history.dto.AnalyticsSummaryResponse.HardQuestionStat;
import com.nmt.history.dto.AnalyticsSummaryResponse.StudentAttemptStat;
import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TestStatsResponse;
import com.nmt.history.dto.TestStatsResponse.QuestionStat;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.GradingStatus;
import com.nmt.history.model.Question;
import com.nmt.history.model.Test;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.QuestionRepository;
import com.nmt.history.repository.TestRepository;
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
    private final AccessPolicy accessPolicy;
    private final TestRepository testRepository;

    private static final class Counter {
        int answered;
        int wrong;
        int pending;
        int earned;
        int max;
    }

    @Transactional(readOnly = true)
    public TestStatsResponse stats(Long testId, String username) {
        return stats(testId, null, username);
    }

    @Transactional(readOnly = true)
    public TestStatsResponse stats(Long testId, Long studentId, String username) {
        User teacher = accessPolicy.requireTeacher(username);
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Тест не знайдено: " + testId));
        accessPolicy.requireView(test.getOwner() == null ? null : test.getOwner().getId(), teacher);
        List<TestResult> results = studentId == null
                ? testResultRepository.findByTestIdAndStudentTeacherId(testId, teacher.getId())
                : testResultRepository.findByTestIdAndStudentTeacherIdAndStudentId(testId, teacher.getId(), studentId);
        Map<Long, Counter> counters = new HashMap<>();
        int pendingReview = 0;
        double scoreSum = 0;
        double maxSum = 0;
        double correctEarned = 0;
        double correctMax = 0;
        for (TestResult result : results) {
            if (result.getGradingStatus() == GradingStatus.PENDING_REVIEW) {
                pendingReview++;
            }
            List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
            if (review == null) {
                continue;
            }
            int resultEarned = 0;
            int resultMax = 0;
            for (QuestionReview item : review) {
                Counter counter = counters.computeIfAbsent(item.questionId(), id -> new Counter());
                counter.answered++;
                resultMax += item.max();
                resultEarned += item.earned();
                if (item.pendingManual()) {
                    counter.pending++;
                    continue;
                }
                counter.earned += item.earned();
                counter.max += item.max();
                correctEarned += item.earned();
                correctMax += item.max();
                if (item.earned() < item.max()) {
                    counter.wrong++;
                }
            }
            scoreSum += resultEarned;
            maxSum += resultMax;
        }

        List<QuestionStat> stats = questionRepository.findByTestIdOrderByIdAsc(testId).stream()
                .filter(q -> counters.containsKey(q.getId()))
                .map(q -> toStat(q, counters.get(q.getId())))
                .sorted(Comparator.comparingInt(QuestionStat::correctPercent))
                .toList();
        double avgScore = maxSum == 0 ? 0 : 100.0 * scoreSum / maxSum;
        double avgCorrect = correctMax == 0 ? 0 : 100.0 * correctEarned / correctMax;
        int completed = (int) results.stream()
                .filter(r -> r.getGradingStatus() != GradingStatus.PENDING_REVIEW)
                .count();
        return new TestStatsResponse(results.size(), completed, pendingReview,
                round1(avgScore), round1(avgCorrect), stats);
    }

    @Transactional(readOnly = true)
    public AnalyticsSummaryResponse analytics(String username, Long testId, Long studentId) {
        User teacher = accessPolicy.requireTeacher(username);
        List<TestResult> results = testResultRepository.findByStudentTeacherIdOrderByCompletedAtDesc(teacher.getId());
        if (testId != null) {
            results = results.stream().filter(r -> r.getTest().getId().equals(testId)).toList();
        }
        if (studentId != null) {
            results = results.stream().filter(r -> r.getStudent().getId().equals(studentId)).toList();
        }

        Map<Long, StudentAgg> byStudent = new HashMap<>();
        Map<Long, HardAgg> byQuestion = new HashMap<>();
        Map<Long, String> testTitles = new HashMap<>();
        int pendingReview = 0;
        double scoreSum = 0;
        double maxSum = 0;
        double correctEarned = 0;
        double correctMax = 0;

        for (TestResult result : results) {
            testTitles.put(result.getTest().getId(), result.getTest().getTitle());
            if (result.getGradingStatus() == GradingStatus.PENDING_REVIEW) {
                pendingReview++;
            }
            StudentAgg student = byStudent.computeIfAbsent(result.getStudent().getId(), id -> {
                StudentAgg a = new StudentAgg();
                a.name = result.getStudent().getFullName();
                a.username = result.getStudent().getUsername();
                return a;
            });
            student.attempts++;
            List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
            if (review == null) {
                continue;
            }
            int earned = 0;
            int max = 0;
            for (QuestionReview item : review) {
                earned += item.earned();
                max += item.max();
                HardAgg hard = byQuestion.computeIfAbsent(item.questionId(), id -> {
                    HardAgg h = new HardAgg();
                    h.testId = result.getTest().getId();
                    h.questionText = item.questionText();
                    return h;
                });
                hard.answered++;
                if (item.pendingManual()) {
                    hard.pending++;
                    continue;
                }
                hard.earned += item.earned();
                hard.max += item.max();
                correctEarned += item.earned();
                correctMax += item.max();
                if (item.earned() < item.max()) {
                    hard.wrong++;
                }
            }
            scoreSum += earned;
            maxSum += max;
            student.earned += earned;
            student.max += max;
            if (student.bestScore == null || earned > student.bestScore) {
                student.bestScore = earned;
                student.bestMax = max;
            }
        }

        List<StudentAttemptStat> students = byStudent.entrySet().stream()
                .map(e -> new StudentAttemptStat(
                        e.getKey(),
                        e.getValue().name,
                        e.getValue().username,
                        e.getValue().attempts,
                        e.getValue().max == 0 ? null : round1(100.0 * e.getValue().earned / e.getValue().max),
                        e.getValue().bestScore,
                        e.getValue().bestMax))
                .sorted(Comparator.comparing(StudentAttemptStat::studentName,
                        Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();

        List<HardQuestionStat> hardest = byQuestion.entrySet().stream()
                .map(e -> {
                    HardAgg h = e.getValue();
                    int scoredMax = h.max;
                    int percent = scoredMax == 0 ? (h.pending > 0 ? -1 : 0)
                            : (int) Math.round(100.0 * h.earned / scoredMax);
                    if (percent < 0) {
                        percent = 0;
                    }
                    return new HardQuestionStat(e.getKey(), h.testId,
                            testTitles.getOrDefault(h.testId, ""),
                            h.questionText, h.answered, h.wrong, h.pending, percent);
                })
                .sorted(Comparator.comparingInt(HardQuestionStat::correctPercent)
                        .thenComparing(Comparator.comparingInt(HardQuestionStat::wrong).reversed()))
                .limit(20)
                .toList();

        int completed = (int) results.stream()
                .filter(r -> r.getGradingStatus() != GradingStatus.PENDING_REVIEW)
                .count();
        return new AnalyticsSummaryResponse(
                results.size(),
                completed,
                pendingReview,
                round1(maxSum == 0 ? 0 : 100.0 * scoreSum / maxSum),
                round1(correctMax == 0 ? 0 : 100.0 * correctEarned / correctMax),
                students,
                hardest);
    }

    private QuestionStat toStat(Question question, Counter counter) {
        int scoredMax = counter.max;
        int percent = scoredMax == 0 ? 0 : (int) Math.round(100.0 * counter.earned / scoredMax);
        return new QuestionStat(question.getId(), question.getQuestionText(),
                question.getQuestionType() == null ? null : question.getQuestionType().name(),
                counter.answered, counter.wrong, counter.pending, percent);
    }

    private static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    private static final class StudentAgg {
        String name;
        String username;
        int attempts;
        int earned;
        int max;
        Integer bestScore;
        Integer bestMax;
    }

    private static final class HardAgg {
        Long testId;
        String questionText;
        int answered;
        int wrong;
        int pending;
        int earned;
        int max;
    }
}
