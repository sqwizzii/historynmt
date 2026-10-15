package com.nmt.history.repository;

import com.nmt.history.model.Subscription;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    List<Subscription> findByUserIdOrderByExpiresAtDesc(Long userId);

    long countByStatusAndExpiresAtAfter(com.nmt.history.model.SubscriptionStatus status, java.time.LocalDateTime now);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("delete from Subscription s where s.userId = :userId")
    void deleteByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("update Subscription s set s.createdBy = null where s.createdBy = :userId")
    void clearCreator(@org.springframework.data.repository.query.Param("userId") Long userId);
}
