package com.nmt.history.dto;

import com.nmt.history.model.Flashcard;

public record FlashcardResponse(Long id, String termOrQuestion, String answerOrDate, String imageUrl) {

    public static FlashcardResponse from(Flashcard flashcard) {
        return new FlashcardResponse(flashcard.getId(), flashcard.getTermOrQuestion(), flashcard.getAnswerOrDate(), flashcard.getImageUrl());
    }
}
