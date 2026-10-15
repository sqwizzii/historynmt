package com.nmt.history.controller;

import com.nmt.history.dto.CreateModuleRequest;
import com.nmt.history.dto.FlashcardRequest;
import com.nmt.history.dto.FlashcardResponse;
import com.nmt.history.dto.QuizletModuleResponse;
import com.nmt.history.dto.UpdateModuleRequest;
import com.nmt.history.service.QuizletService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/quizlet")
@RequiredArgsConstructor
public class QuizletController {

    private final QuizletService quizletService;

    @GetMapping
    public List<QuizletModuleResponse> getAllModules(Authentication authentication) {
        return quizletService.getAllModules(name(authentication));
    }

    @GetMapping("/{moduleId}")
    public QuizletModuleResponse getModule(@PathVariable Long moduleId, Authentication authentication) {
        return quizletService.getModule(moduleId, name(authentication));
    }

    @PostMapping("/create")
    public ResponseEntity<QuizletModuleResponse> createModule(@Valid @RequestBody CreateModuleRequest request,
                                                              Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizletService.createModule(request, name(authentication)));
    }

    @PostMapping("/{moduleId}/cards")
    public ResponseEntity<FlashcardResponse> addFlashcard(@PathVariable Long moduleId,
                                                          @Valid @RequestBody FlashcardRequest request,
                                                          Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizletService.addFlashcard(moduleId, request, name(authentication)));
    }

    @PutMapping("/{moduleId}")
    public QuizletModuleResponse updateModule(@PathVariable Long moduleId,
                                              @Valid @RequestBody UpdateModuleRequest request,
                                              Authentication authentication) {
        return quizletService.updateModule(moduleId, request, name(authentication));
    }

    @DeleteMapping("/{moduleId}")
    public ResponseEntity<Void> deleteModule(@PathVariable Long moduleId, Authentication authentication) {
        quizletService.deleteModule(moduleId, name(authentication));
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/cards/{cardId}")
    public FlashcardResponse updateFlashcard(@PathVariable Long cardId, @Valid @RequestBody FlashcardRequest request,
                                            Authentication authentication) {
        return quizletService.updateFlashcard(cardId, request, name(authentication));
    }

    @DeleteMapping("/cards/{cardId}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long cardId, Authentication authentication) {
        quizletService.deleteFlashcard(cardId, name(authentication));
        return ResponseEntity.noContent().build();
    }

    private static String name(Authentication authentication) {
        return authentication == null ? null : authentication.getName();
    }
}
