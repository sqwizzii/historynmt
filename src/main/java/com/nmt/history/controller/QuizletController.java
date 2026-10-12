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
    public List<QuizletModuleResponse> getAllModules() {
        return quizletService.getAllModules();
    }

    @GetMapping("/{moduleId}")
    public QuizletModuleResponse getModule(@PathVariable Long moduleId) {
        return quizletService.getModule(moduleId);
    }

    @PostMapping("/create")
    public ResponseEntity<QuizletModuleResponse> createModule(@Valid @RequestBody CreateModuleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizletService.createModule(request));
    }

    @PostMapping("/{moduleId}/cards")
    public ResponseEntity<FlashcardResponse> addFlashcard(@PathVariable Long moduleId,
                                                          @Valid @RequestBody FlashcardRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizletService.addFlashcard(moduleId, request));
    }

    @PutMapping("/{moduleId}")
    public QuizletModuleResponse updateModule(@PathVariable Long moduleId,
                                              @Valid @RequestBody UpdateModuleRequest request) {
        return quizletService.updateModule(moduleId, request);
    }

    @DeleteMapping("/{moduleId}")
    public ResponseEntity<Void> deleteModule(@PathVariable Long moduleId) {
        quizletService.deleteModule(moduleId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/cards/{cardId}")
    public FlashcardResponse updateFlashcard(@PathVariable Long cardId, @Valid @RequestBody FlashcardRequest request) {
        return quizletService.updateFlashcard(cardId, request);
    }

    @DeleteMapping("/cards/{cardId}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long cardId) {
        quizletService.deleteFlashcard(cardId);
        return ResponseEntity.noContent().build();
    }
}
