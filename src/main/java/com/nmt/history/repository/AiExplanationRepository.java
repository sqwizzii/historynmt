package com.nmt.history.repository;

import com.nmt.history.model.AiExplanation;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiExplanationRepository extends JpaRepository<AiExplanation, Long> {

    Optional<AiExplanation> findByQuestionIdAndContentHashAndAnswerHash(Long questionId, String contentHash, String answerHash);
}
