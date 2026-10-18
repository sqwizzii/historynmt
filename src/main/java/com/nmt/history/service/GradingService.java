package com.nmt.history.service;

import com.nmt.history.dto.GradeQuestionRequest;
import com.nmt.history.dto.GradeResultRequest;
import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.GradingStatus;
import com.nmt.history.model.Role;
import com.nmt.history.model.ScoringScale;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.TestResultRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Ручне оцінювання відкритих відповідей учителем. */
@Service
@RequiredArgsConstructor
public class GradingService {

    private final TestResultRepository testResultRepository;
    private final ReviewService reviewService;
    private final AccessPolicy accessPolicy;
    private final NmtScoreConverter nmtScoreConverter;

    @Transactional
    public TestResultResponse grade(Long resultId, GradeResultRequest request, String username) {
        User teacher = accessPolicy.requireTeacher(username);
        TestResult result = testResultRepository.findById(resultId)
                .filter(r -> teacher.getId().equals(r.getStudent().getTeacherId())
                        || teacher.getRole() == Role.ADMIN)
                .orElseThrow(() -> new ResourceNotFoundException("Результат не знайдено: " + resultId));

        List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
        if (review == null || review.isEmpty()) {
            throw new BadRequestException("У цього результату немає розбору для оцінювання");
        }

        Map<Long, GradeQuestionRequest> grades = new HashMap<>();
        if (request.grades() != null) {
            for (GradeQuestionRequest g : request.grades()) {
                if (grades.put(g.questionId(), g) != null) {
                    throw new BadRequestException("Дубльована оцінка для питання " + g.questionId());
                }
            }
        }

        List<QuestionReview> updated = new ArrayList<>();
        int score = 0;
        int maxScore = 0;
        int pending = 0;
        for (QuestionReview item : review) {
            GradeQuestionRequest grade = grades.get(item.questionId());
            QuestionReview next = item;
            if (grade != null) {
                if (!item.needsManualGrading() && item.questionType() != com.nmt.history.model.QuestionType.OPEN) {
                    throw new BadRequestException("Питання " + item.questionId() + " не потребує ручного оцінювання");
                }
                if (grade.earned() > item.max()) {
                    throw new BadRequestException("Бал за питання " + item.questionId()
                            + " не може перевищувати максимум (" + item.max() + ")");
                }
                next = item.withManual(grade.earned(), false, blankToNull(grade.comment()));
            } else if (item.pendingManual()) {
                pending++;
            }
            score += next.earned();
            maxScore += next.max();
            if (next.pendingManual()) {
                // already counted above when grade == null
            }
            updated.add(next);
        }
        // перерахунок pending після застосування оцінок
        pending = (int) updated.stream().filter(QuestionReview::pendingManual).count();

        if (request.teacherComment() != null) {
            result.setTeacherComment(blankToNull(request.teacherComment()));
        }
        result.setScore(score);
        result.setPendingManualCount(pending);
        boolean complete = !Boolean.FALSE.equals(request.complete());
        if (complete && pending == 0) {
            result.setGradingStatus(GradingStatus.COMPLETED);
            if (result.getTest().getScoringScale() == ScoringScale.NMT) {
                result.setNmtScore(nmtScoreConverter.convert(score, maxScore));
            }
        } else if (pending > 0) {
            result.setGradingStatus(GradingStatus.PENDING_REVIEW);
            result.setNmtScore(null);
        }
        result.setReviewJson(reviewService.toJson(updated));
        return TestResultResponse.from(result, maxScore, reviewService.withSignedImages(updated));
    }

    @Transactional(readOnly = true)
    public List<TestResultResponse> pendingForTeacher(String username) {
        User teacher = accessPolicy.requireTeacher(username);
        return testResultRepository.findByStudentTeacherIdOrderByCompletedAtDesc(teacher.getId()).stream()
                .filter(r -> r.getGradingStatus() == GradingStatus.PENDING_REVIEW)
                .map(TestResultResponse::from)
                .toList();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
