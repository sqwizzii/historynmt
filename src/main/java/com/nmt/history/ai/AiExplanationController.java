package com.nmt.history.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tests/{testId}/questions/{questionId}/explanation")
@RequiredArgsConstructor
public class AiExplanationController {

    private final AiExplanationService service;

    @PostMapping
    public ExplanationResponse explain(@PathVariable Long testId, @PathVariable Long questionId, Authentication authentication) {
        return service.explain(testId, questionId, authentication.getName());
    }
}
