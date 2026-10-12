package com.nmt.history.repository;

import com.nmt.history.model.Option;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OptionRepository extends JpaRepository<Option, Long> {

    List<Option> findByQuestionId(Long questionId);

    List<Option> findByQuestionIdOrderByOrderIndexAsc(Long questionId);
}
