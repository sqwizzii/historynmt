package com.nmt.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateModuleRequest(
        @NotBlank @Size(max = 255) String title,
        String description,
        @Valid List<FlashcardRequest> flashcards) {
}
