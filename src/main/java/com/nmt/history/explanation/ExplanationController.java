package com.nmt.history.explanation;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tests/{testId}/questions/{questionId}/explanation")
@RequiredArgsConstructor
public class ExplanationController {

    private final ExplanationService service;

    @PostMapping
    public ExplanationResponse explanation(@PathVariable Long testId, @PathVariable Long questionId, Authentication authentication) {
        return service.find(testId, questionId, authentication.getName());
    }
}
