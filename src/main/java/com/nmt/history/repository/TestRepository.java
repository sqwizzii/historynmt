package com.nmt.history.repository;

import com.nmt.history.model.Test;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface TestRepository extends org.springframework.data.jpa.repository.JpaRepository<Test, Long> {

    @EntityGraph(attributePaths = "subject")
    List<Test> findByOwnerIsNullOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "subject")
    @Query("select t from Test t where t.owner is null or t.owner.id = :ownerId order by t.createdAt desc")
    List<Test> findVisible(@Param("ownerId") Long ownerId);

    long countByOwnerIsNull();

    @org.springframework.data.jpa.repository.Modifying
    @Query("update Test t set t.owner = :owner where t.owner is null")
    int assignOwnerToUnowned(@Param("owner") com.nmt.history.model.User owner);

    @Query("select q.test.id as testId, count(q) as total from Question q group by q.test.id")
    List<QuestionCount> countQuestions();

    interface QuestionCount {
        Long getTestId();

        long getTotal();
    }
}
