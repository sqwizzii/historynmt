package com.nmt.history.dto;

import com.nmt.history.model.SubscriptionPlan;

public record PlanResponse(SubscriptionPlan plan, String name, int periodDays) {
}
