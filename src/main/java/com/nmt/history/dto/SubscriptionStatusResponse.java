package com.nmt.history.dto;

import com.nmt.history.model.SubscriptionPlan;
import java.time.LocalDateTime;

/** Стан доступу вчителя: платна підписка або тимчасовий безкоштовний доступ для користувачів, що були до підписок. */
public record SubscriptionStatusResponse(boolean active, SubscriptionPlan plan, LocalDateTime expiresAt, boolean legacyFreeAccess) {
}
