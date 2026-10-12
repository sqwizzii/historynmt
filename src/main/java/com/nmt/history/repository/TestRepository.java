package com.nmt.history.repository;

import com.nmt.history.dto.TestSummaryResponse;
import com.nmt.history.model.Test;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {

    @Query("select new com.nmt.history.dto.TestSummaryResponse(t.id, t.title, t.description, t.timeLimitMinutes, "
            + "t.createdAt, count(q)) from Test t left join t.questions q "
            + "group by t.id, t.title, t.description, t.timeLimitMinutes, t.createdAt "
            + "order by t.createdAt desc")
    List<TestSummaryResponse> findAllSummaries();
}
