package com.nmt.history.repository;

import com.nmt.history.model.Subject;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByActiveTrueOrderBySortOrderAscNameAsc();

    boolean existsBySlug(String slug);

    java.util.List<Subject> findAllByOrderBySortOrderAscNameAsc();
}
