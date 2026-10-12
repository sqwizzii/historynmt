package com.nmt.history.repository;

import com.nmt.history.model.QuizletModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizletModuleRepository extends JpaRepository<QuizletModule, Long> {
}
