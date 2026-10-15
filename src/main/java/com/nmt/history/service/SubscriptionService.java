package com.nmt.history.service;

import com.nmt.history.dto.PlanResponse;
import com.nmt.history.dto.SubscriptionStatusResponse;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.model.Role;
import com.nmt.history.model.Subscription;
import com.nmt.history.model.SubscriptionPlan;
import com.nmt.history.model.SubscriptionStatus;
import com.nmt.history.model.User;
import com.nmt.history.repository.SubscriptionRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Два плани з однаковими можливостями: місячний і річний. Підписку активує, продовжує й скасовує лише адміністратор;
 * платіжного провайдера немає, а доступ перевіряється на сервері за записами в БД.
 */
@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository repository;

    public List<PlanResponse> plans() {
        return List.of(
                new PlanResponse(SubscriptionPlan.MONTHLY, "Місячний", 30),
                new PlanResponse(SubscriptionPlan.YEARLY, "Річний", 365));
    }

    @Transactional(readOnly = true)
    public SubscriptionStatusResponse status(User user) {
        Subscription current = current(user.getId());
        return new SubscriptionStatusResponse(hasAccess(user), current == null ? null : current.getPlan(),
                current == null ? null : current.getExpiresAt(), user.isLegacyFreeAccess());
    }

    /** Адміністратору підписка не потрібна; вчителю потрібна активна підписка або тимчасовий безкоштовний доступ. */
    @Transactional(readOnly = true)
    public boolean hasAccess(User user) {
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        return user.getRole() == Role.TEACHER && (user.isLegacyFreeAccess() || current(user.getId()) != null);
    }

    @Transactional
    public Subscription grant(User teacher, SubscriptionPlan plan, User admin) {
        if (teacher.getRole() != Role.TEACHER) {
            throw new BadRequestException("Підписка призначається лише вчителю");
        }
        LocalDateTime now = LocalDateTime.now();
        Subscription active = current(teacher.getId());
        LocalDateTime start = active != null && active.getExpiresAt().isAfter(now) ? active.getExpiresAt() : now;
        int days = plans().stream().filter(p -> p.plan() == plan).findFirst().orElseThrow().periodDays();
        return repository.save(Subscription.builder()
                .userId(teacher.getId()).plan(plan).status(SubscriptionStatus.ACTIVE)
                .startsAt(now).expiresAt(start.plusDays(days)).createdBy(admin.getId()).build());
    }

    @Transactional
    public void cancel(User teacher) {
        LocalDateTime now = LocalDateTime.now();
        for (Subscription s : repository.findByUserIdOrderByExpiresAtDesc(teacher.getId())) {
            if (s.getStatus() == SubscriptionStatus.ACTIVE) {
                s.setStatus(SubscriptionStatus.CANCELLED);
                s.setCancelledAt(now);
                repository.save(s);
            }
        }
    }

    private Subscription current(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        return repository.findByUserIdOrderByExpiresAtDesc(userId).stream()
                .filter(s -> s.getStatus() == SubscriptionStatus.ACTIVE && s.getExpiresAt().isAfter(now))
                .findFirst().orElse(null);
    }
}
