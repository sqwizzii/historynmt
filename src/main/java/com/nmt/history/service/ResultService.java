package com.nmt.history.service;

import com.nmt.history.dto.TestResultResponse;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.User;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import java.util.List;
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
}
