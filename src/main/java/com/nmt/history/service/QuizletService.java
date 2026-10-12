package com.nmt.history.service;

import com.nmt.history.dto.CreateModuleRequest;
import com.nmt.history.dto.FlashcardRequest;
import com.nmt.history.dto.FlashcardResponse;
import com.nmt.history.dto.QuizletModuleResponse;
import com.nmt.history.dto.UpdateModuleRequest;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Flashcard;
import com.nmt.history.model.QuizletModule;
import com.nmt.history.repository.FlashcardRepository;
import com.nmt.history.repository.QuizletModuleRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizletService {

    private final QuizletModuleRepository moduleRepository;
    private final FlashcardRepository flashcardRepository;

    @Transactional(readOnly = true)
    public List<QuizletModuleResponse> getAllModules() {
        return moduleRepository.findAllByOrderByIdAsc().stream()
                .map(QuizletModuleResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuizletModuleResponse getModule(Long moduleId) {
        return QuizletModuleResponse.from(findModule(moduleId));
    }

    @Transactional
    public QuizletModuleResponse createModule(CreateModuleRequest request) {
        QuizletModule module = QuizletModule.builder()
                .title(request.title().trim())
                .description(request.description())
                .build();
        if (request.flashcards() != null) {
            request.flashcards().forEach(card -> module.addFlashcard(toFlashcard(card)));
        }
        return QuizletModuleResponse.from(moduleRepository.save(module));
    }

    @Transactional
    public FlashcardResponse addFlashcard(Long moduleId, FlashcardRequest request) {
        QuizletModule module = findModule(moduleId);
        Flashcard flashcard = toFlashcard(request);
        flashcard.setModule(module);
        return FlashcardResponse.from(flashcardRepository.save(flashcard));
    }

    @Transactional
    public QuizletModuleResponse updateModule(Long moduleId, UpdateModuleRequest request) {
        QuizletModule module = findModule(moduleId);
        module.setTitle(request.title().trim());
        module.setDescription(request.description() == null || request.description().isBlank() ? null : request.description());
        return QuizletModuleResponse.from(module);
    }

    @Transactional
    public void deleteModule(Long moduleId) {
        moduleRepository.delete(findModule(moduleId));
    }

    @Transactional
    public FlashcardResponse updateFlashcard(Long cardId, FlashcardRequest request) {
        Flashcard flashcard = findFlashcard(cardId);
        flashcard.setTermOrQuestion(request.termOrQuestion().trim());
        flashcard.setAnswerOrDate(request.answerOrDate().trim());
        return FlashcardResponse.from(flashcard);
    }

    @Transactional
    public void deleteFlashcard(Long cardId) {
        flashcardRepository.delete(findFlashcard(cardId));
    }

    private Flashcard findFlashcard(Long cardId) {
        return flashcardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Картку не знайдено: " + cardId));
    }

    private Flashcard toFlashcard(FlashcardRequest request) {
        return Flashcard.builder()
                .termOrQuestion(request.termOrQuestion().trim())
                .answerOrDate(request.answerOrDate().trim())
                .build();
    }

    private QuizletModule findModule(Long moduleId) {
        return moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Модуль не знайдено: " + moduleId));
    }
}
