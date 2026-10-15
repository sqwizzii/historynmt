package com.nmt.history.repository;

import com.nmt.history.model.PracticeFix;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PracticeFixRepository extends JpaRepository<PracticeFix, Long> {

    List<PracticeFix> findByStudentId(Long studentId);

    Optional<PracticeFix> findByStudentIdAndQuestionId(Long studentId, Long questionId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from PracticeFix f where f.studentId = :studentId")
    void deleteByStudentId(@org.springframework.data.repository.query.Param("studentId") Long studentId);
}
