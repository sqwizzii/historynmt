package com.nmt.history.service;

import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Test;
import com.nmt.history.model.TestAssignment;
import com.nmt.history.model.User;
import com.nmt.history.repository.TestAssignmentRepository;
import com.nmt.history.repository.TestRepository;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Призначення тестів учням: порожній список означає «усім учням вчителя». Лише для власних тестів. */
@Service
@RequiredArgsConstructor
public class AssignmentService {

    private final TestRepository testRepository;
    private final TestAssignmentRepository assignmentRepository;
    private final AccessPolicy accessPolicy;

    @Transactional(readOnly = true)
    public List<Long> assignedStudentIds(Long testId, String username) {
        findOwnTest(testId, username);
        return assignmentRepository.findByTestId(testId).stream().map(TestAssignment::getStudentId).sorted().toList();
    }

    @Transactional
    public List<Long> replace(Long testId, List<Long> studentIds, String username) {
        Test test = findOwnTest(testId, username);
        User teacher = accessPolicy.requireTeacher(username);
        Set<Long> unique = new LinkedHashSet<>(studentIds == null ? List.of() : studentIds);
        if (unique.size() > 1000) {
            throw new BadRequestException("Забагато учнів");
        }
        for (Long studentId : unique) {
            accessPolicy.requireOwnStudent(teacher, studentId);
        }
        assignmentRepository.deleteByTestId(test.getId());
        assignmentRepository.flush();
        unique.forEach(id -> assignmentRepository.save(TestAssignment.builder().testId(test.getId()).studentId(id).build()));
        return unique.stream().sorted().toList();
    }

    private Test findOwnTest(Long testId, String username) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Тест не знайдено: " + testId));
        User actor = accessPolicy.requireTeacher(username);
        accessPolicy.requireEdit(test.getOwner() == null ? null : test.getOwner().getId(), actor);
        return test;
    }
}
