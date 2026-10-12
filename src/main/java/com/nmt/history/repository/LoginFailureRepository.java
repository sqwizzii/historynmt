package com.nmt.history.repository;

import com.nmt.history.model.LoginFailure;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LoginFailureRepository extends JpaRepository<LoginFailure, Long> {

    long countByUsernameAndAttemptedAtAfter(String username, LocalDateTime threshold);

    void deleteByUsername(String username);

    void deleteByAttemptedAtBefore(LocalDateTime threshold);
}
