package com.nmt.history.repository;

import com.nmt.history.model.QuizletModule;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizletModuleRepository extends JpaRepository<QuizletModule, Long> {

    @EntityGraph(attributePaths = "flashcards")
    List<QuizletModule> findAllByOrderByIdAsc();
}
