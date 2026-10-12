package com.nmt.history.repository;

import com.nmt.history.model.TestResult;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TestResultRepository extends JpaRepository<TestResult, Long> {

    @EntityGraph(attributePaths = {"student", "test"})
    List<TestResult> findByStudentIdOrderByCompletedAtDesc(Long studentId);

    @EntityGraph(attributePaths = {"student", "test"})
    List<TestResult> findAllByOrderByCompletedAtDesc();

    @Query("select r.student.id as studentId, count(r) as attempts, max(r.nmtScore) as bestNmtScore "
            + "from TestResult r group by r.student.id")
    List<StudentStats> findStudentStats();

    List<TestResult> findByTestId(Long testId);
}
