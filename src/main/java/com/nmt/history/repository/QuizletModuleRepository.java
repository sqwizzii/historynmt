package com.nmt.history.repository;

import com.nmt.history.model.QuizletModule;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizletModuleRepository extends JpaRepository<QuizletModule, Long> {

    @EntityGraph(attributePaths = {"flashcards", "subject"})
    List<QuizletModule> findByOwnerIsNullOrderByIdAsc();

    @EntityGraph(attributePaths = {"flashcards", "subject"})
    @Query("select distinct m from QuizletModule m where m.owner is null or m.owner.id = :ownerId order by m.id asc")
    List<QuizletModule> findVisible(@Param("ownerId") Long ownerId);

    long countByOwnerIsNull();

    @org.springframework.data.jpa.repository.Modifying
    @Query("update QuizletModule m set m.owner = :owner where m.owner is null")
    int assignOwnerToUnowned(@Param("owner") com.nmt.history.model.User owner);

    long countByOwnerId(Long ownerId);

    long countBySubjectId(Long subjectId);
}
