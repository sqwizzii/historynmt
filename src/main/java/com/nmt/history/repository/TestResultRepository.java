package com.nmt.history.repository;

import com.nmt.history.model.TestResult;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    @EntityGraph(attributePaths = {"student", "test"})
    List<TestResult> findByStudentIdOrderByCompletedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"student", "test"})
    List<TestResult> findAllByOrderByCompletedAtDesc();

    List<TestResult> findByTestId(Long testId);
}
