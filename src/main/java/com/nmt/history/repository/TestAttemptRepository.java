package com.nmt.history.repository;

import com.nmt.history.model.TestAttempt;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {

    Optional<TestAttempt> findFirstByStudentIdAndTestIdOrderByIdDesc(Long studentId, Long testId);

    void deleteByStudentIdAndTestId(Long studentId, Long testId);

    void deleteByStudentId(Long studentId);
}
