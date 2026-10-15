package com.nmt.history.controller;

import com.nmt.history.dto.PlanResponse;
import com.nmt.history.dto.SubscriptionStatusResponse;
import com.nmt.history.service.AccessPolicy;
import com.nmt.history.service.SubscriptionService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/subscription")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final AccessPolicy accessPolicy;

    @GetMapping("/plans")
    public List<PlanResponse> plans() {
        return subscriptionService.plans();
    }

    @GetMapping("/me")
    public SubscriptionStatusResponse me(Authentication authentication) {
        return subscriptionService.status(accessPolicy.requireActor(authentication.getName()));
    }
}
