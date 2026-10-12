package com.nmt.history.dto;

import com.nmt.history.model.QuizletModule;
import java.util.Comparator;
import java.util.List;

public record QuizletModuleResponse(Long id, String title, String description, List<FlashcardResponse> flashcards) {

    public static QuizletModuleResponse from(QuizletModule module) {
        List<FlashcardResponse> cards = module.getFlashcards().stream()
                .sorted(Comparator.comparing(f -> f.getId() == null ? Long.MAX_VALUE : f.getId()))
                .map(FlashcardResponse::from)
                .toList();
        return new QuizletModuleResponse(module.getId(), module.getTitle(), module.getDescription(), cards);
    }
}
