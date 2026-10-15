package com.nmt.history.repository;

import com.nmt.history.model.TestAssignment;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TestAssignmentRepository extends JpaRepository<TestAssignment, Long> {

    List<TestAssignment> findByTestId(Long testId);

    boolean existsByTestId(Long testId);

    boolean existsByTestIdAndStudentId(Long testId, Long studentId);

    @Query("select distinct a.testId from TestAssignment a")
    Set<Long> findRestrictedTestIds();

    @Query("select a.testId from TestAssignment a where a.studentId = :studentId")
    Set<Long> findTestIdsByStudent(@Param("studentId") Long studentId);

    @Modifying
    @Query("delete from TestAssignment a where a.testId = :testId")
    void deleteByTestId(@Param("testId") Long testId);

    @Modifying
    @Query("delete from TestAssignment a where a.studentId = :studentId")
    void deleteByStudentId(@Param("studentId") Long studentId);
}
