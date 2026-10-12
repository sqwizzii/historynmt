package com.nmt.history.repository;

import com.nmt.history.model.TestResult;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Modifying
    @Query("delete from TestResult r where r.test.id = :testId")
    void deleteByTestId(@Param("testId") Long testId);

    @Modifying
    @Query("delete from TestResult r where r.student.id = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}
