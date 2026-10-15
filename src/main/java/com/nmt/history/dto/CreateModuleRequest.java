package com.nmt.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateModuleRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @Valid List<FlashcardRequest> flashcards,
        Long subjectId,
        @Min(1) @Max(11) Integer grade) {

    public CreateModuleRequest(String title, String description, List<FlashcardRequest> flashcards) {
        this(title, description, flashcards, null, null);
    }
}
