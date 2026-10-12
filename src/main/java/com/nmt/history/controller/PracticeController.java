package com.nmt.history.controller;

import com.nmt.history.dto.MistakesResponse;
import com.nmt.history.dto.PracticeResultResponse;
import com.nmt.history.dto.TestSubmitRequest;
import com.nmt.history.service.PracticeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;

    @GetMapping("/mistakes")
    public MistakesResponse mistakes(Authentication authentication) {
        return practiceService.mistakes(authentication.getName());
    }

    @PostMapping("/mistakes/check")
    public PracticeResultResponse check(@Valid @RequestBody TestSubmitRequest request, Authentication authentication) {
        return practiceService.check(authentication.getName(), request);
    }
}
