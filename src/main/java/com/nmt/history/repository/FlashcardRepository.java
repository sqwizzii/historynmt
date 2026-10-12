package com.nmt.history.repository;

import com.nmt.history.model.Flashcard;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {

    List<Flashcard> findByModuleId(Long moduleId);
}
