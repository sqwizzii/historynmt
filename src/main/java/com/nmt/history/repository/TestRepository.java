package com.nmt.history.repository;

import com.nmt.history.model.Test;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {

    List<Test> findAllByOrderByCreatedAtDesc();
}
