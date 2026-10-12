package com.nmt.history.service;

import com.nmt.history.dto.StudentResponse;
import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Role;
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

    @Transactional(readOnly = true)
    public List<TestResultResponse> getMyResults(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
        return testResultRepository.findByStudentIdOrderByCompletedAtDesc(user.getId()).stream()
                .map(TestResultResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TestResultResponse> getAllResults() {
        return testResultRepository.findAllByOrderByCompletedAtDesc().stream()
                .map(TestResultResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getStudents() {
        Map<Long, StudentStats> stats = testResultRepository.findStudentStats().stream()
                .collect(Collectors.toMap(StudentStats::getStudentId, Function.identity()));
        return userRepository.findByRoleOrderByUsernameAsc(Role.STUDENT).stream()
                .map(user -> {
                    StudentStats s = stats.get(user.getId());
                    return new StudentResponse(user.getId(), user.getUsername(), user.getEmail(),
                            s == null ? 0 : s.getAttempts(), s == null ? null : s.getBestNmtScore());
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TestResultResponse> getStudentResults(Long studentId) {
        userRepository.findById(studentId)
                .filter(user -> user.getRole() == Role.STUDENT)
                .orElseThrow(() -> new ResourceNotFoundException("Учня не знайдено: " + studentId));
        return testResultRepository.findByStudentIdOrderByCompletedAtDesc(studentId).stream()
                .map(TestResultResponse::from)
                .toList();
    }
}
