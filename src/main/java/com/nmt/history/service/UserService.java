package com.nmt.history.service;

import com.nmt.history.dto.ChangePasswordRequest;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Role;
import com.nmt.history.model.User;
import com.nmt.history.repository.TestResultRepository;
import com.nmt.history.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final TestResultRepository testResultRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Користувача не знайдено: " + username));
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new BadRequestException("Поточний пароль введено невірно");
        }
        user.setPassword(passwordEncoder.encode(request.newPassword()));
    }

    @Transactional
    public void resetStudentPassword(Long studentId, String newPassword) {
        findStudent(studentId).setPassword(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void deleteStudent(Long studentId) {
        User student = findStudent(studentId);
        testResultRepository.deleteByStudentId(studentId);
        userRepository.delete(student);
    }

    private User findStudent(Long studentId) {
        return userRepository.findById(studentId)
                .filter(user -> user.getRole() == Role.STUDENT)
                .orElseThrow(() -> new ResourceNotFoundException("Учня не знайдено: " + studentId));
    }
}
