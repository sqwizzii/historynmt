package com.nmt.history.service;

import com.nmt.history.dto.QuestionReview;
import com.nmt.history.dto.StudentResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Role;
import com.nmt.history.model.TestResult;
import com.nmt.history.model.User;
import com.nmt.history.repository.StudentStats;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final TestResultRepository testResultRepository;
    private final UserRepository userRepository;
    private final ReviewService reviewService;
    private final AccessPolicy accessPolicy;

    @Transactional(readOnly = true)
    public List<TestResultResponse> getMyResults(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
        return testResultRepository.findByStudentIdOrderByCompletedAtDesc(user.getId()).stream()
                .map(TestResultResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TestResultResponse> getAllResults(String username) {
        User teacher = accessPolicy.requireTeacher(username);
        return testResultRepository.findByStudentTeacherIdOrderByCompletedAtDesc(teacher.getId()).stream()
                .map(TestResultResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getStudents(String username) {
        User teacher = accessPolicy.requireTeacher(username);
        Map<Long, StudentStats> stats = testResultRepository.findStudentStats(teacher.getId()).stream()
                .collect(Collectors.toMap(StudentStats::getStudentId, Function.identity()));
        return userRepository.findByRoleAndTeacherIdOrderByUsernameAsc(Role.STUDENT, teacher.getId()).stream()
                .map(user -> {
                    StudentStats s = stats.get(user.getId());
                    return new StudentResponse(user.getId(), user.getUsername(), user.getFullName(),
                            s == null ? 0 : s.getAttempts(), s == null ? null : s.getBestNmtScore());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TestResultResponse> getStudentResults(Long studentId, String username) {
        User teacher = accessPolicy.requireTeacher(username);
        accessPolicy.requireOwnStudent(teacher, studentId);
        return testResultRepository.findByStudentIdOrderByCompletedAtDesc(studentId).stream()
                .map(TestResultResponse::from)
                .toList();
    }

    /** Результат бачить сам учень або вчитель, до якого прив'язаний учень; для решти він не існує (404). */
    @Transactional(readOnly = true)
    public TestResultResponse getResult(Long resultId, String username) {
        User actor = accessPolicy.requireActor(username);
        TestResult result = testResultRepository.findById(resultId)
                .filter(r -> r.getStudent().getId().equals(actor.getId())
                        || (actor.getRole() == Role.TEACHER && actor.getId().equals(r.getStudent().getTeacherId())))
                .orElseThrow(() -> new ResourceNotFoundException("Результат не знайдено: " + resultId));
        List<QuestionReview> review = reviewService.fromJson(result.getReviewJson());
        Integer maxScore = review == null ? null : review.stream().mapToInt(QuestionReview::max).sum();
        return TestResultResponse.from(result, maxScore, reviewService.withSignedImages(review));
    }
}
