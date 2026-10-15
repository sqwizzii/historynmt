package com.nmt.history.service;

import com.nmt.history.dto.CreateModuleRequest;
import com.nmt.history.dto.FlashcardRequest;
import com.nmt.history.dto.FlashcardResponse;
import com.nmt.history.dto.QuizletModuleResponse;
import com.nmt.history.dto.UpdateModuleRequest;
import com.nmt.history.exception.BadRequestException;
import com.nmt.history.exception.ResourceNotFoundException;
import com.nmt.history.model.Flashcard;
import com.nmt.history.model.QuizletModule;
import com.nmt.history.model.Subject;
import com.nmt.history.model.User;
import com.nmt.history.repository.FlashcardRepository;
import com.nmt.history.repository.QuizletModuleRepository;
import com.nmt.history.repository.SubjectRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class QuizletService {

    private final QuizletModuleRepository moduleRepository;
    private final FlashcardRepository flashcardRepository;
    private final AccessPolicy accessPolicy;
    private final SubjectRepository subjectRepository;

    @Transactional(readOnly = true)
    public List<QuizletModuleResponse> getAllModules(String username) {
        User actor = accessPolicy.actor(username);
        Long ownerId = accessPolicy.visibleOwnerId(actor);
        List<QuizletModule> modules = ownerId == null
                ? moduleRepository.findByOwnerIsNullOrderByIdAsc()
                : moduleRepository.findVisible(ownerId);
        return modules.stream()
                .map(m -> QuizletModuleResponse.from(m, accessPolicy.canEdit(ownerId(m), actor)))
                .toList();
    }

    @Transactional(readOnly = true)
    public QuizletModuleResponse getModule(Long moduleId, String username) {
        User actor = accessPolicy.actor(username);
        QuizletModule module = findModule(moduleId);
        accessPolicy.requireView(ownerId(module), actor);
        return QuizletModuleResponse.from(module, accessPolicy.canEdit(ownerId(module), actor));
    }

    @Transactional
    public QuizletModuleResponse createModule(CreateModuleRequest request, String username) {
        User owner = accessPolicy.ownerForNew(accessPolicy.requireActor(username));
        QuizletModule module = QuizletModule.builder()
                .title(request.title().trim())
                .description(request.description())
                .owner(owner)
                .subject(resolveSubject(request.subjectId()))
                .grade(request.grade())
                .build();
        if (request.flashcards() != null) {
            request.flashcards().forEach(card -> module.addFlashcard(toFlashcard(card)));
        }
        return QuizletModuleResponse.from(moduleRepository.save(module), true);
    }

    @Transactional
    public FlashcardResponse addFlashcard(Long moduleId, FlashcardRequest request, String username) {
        QuizletModule module = findModule(moduleId);
        accessPolicy.requireEdit(ownerId(module), accessPolicy.actor(username));
        Flashcard flashcard = toFlashcard(request);
        flashcard.setModule(module);
        return FlashcardResponse.from(flashcardRepository.save(flashcard));
    }

    @Transactional
    public QuizletModuleResponse updateModule(Long moduleId, UpdateModuleRequest request, String username) {
        QuizletModule module = findModule(moduleId);
        accessPolicy.requireEdit(ownerId(module), accessPolicy.actor(username));
        module.setTitle(request.title().trim());
        module.setDescription(request.description() == null || request.description().isBlank() ? null : request.description());
        if (request.subjectId() != null) {
            module.setSubject(resolveSubject(request.subjectId()));
        }
        if (request.grade() != null) {
            module.setGrade(request.grade());
        }
        return QuizletModuleResponse.from(module, true);
    }

    @Transactional
    public void deleteModule(Long moduleId, String username) {
        QuizletModule module = findModule(moduleId);
        accessPolicy.requireEdit(ownerId(module), accessPolicy.actor(username));
        moduleRepository.delete(module);
    }

    @Transactional
    public FlashcardResponse updateFlashcard(Long cardId, FlashcardRequest request, String username) {
        Flashcard flashcard = findFlashcard(cardId);
        accessPolicy.requireEdit(ownerId(flashcard.getModule()), accessPolicy.actor(username));
        flashcard.setTermOrQuestion(request.termOrQuestion().trim());
        flashcard.setAnswerOrDate(request.answerOrDate().trim());
        flashcard.setImageUrl(blankToNull(request.imageUrl()));
        return FlashcardResponse.from(flashcard);
    }

    @Transactional
    public void deleteFlashcard(Long cardId, String username) {
        Flashcard flashcard = findFlashcard(cardId);
        accessPolicy.requireEdit(ownerId(flashcard.getModule()), accessPolicy.actor(username));
        flashcardRepository.delete(flashcard);
    }

    private Subject resolveSubject(Long subjectId) {
        if (subjectId == null) {
            return null;
        }
        return subjectRepository.findById(subjectId)
                .filter(Subject::isActive)
                .orElseThrow(() -> new BadRequestException("Невідомий предмет: " + subjectId));
    }

    private static Long ownerId(QuizletModule module) {
        return module.getOwner() == null ? null : module.getOwner().getId();
    }

    private Flashcard findFlashcard(Long cardId) {
        return flashcardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Картку не знайдено: " + cardId));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private Flashcard toFlashcard(FlashcardRequest request) {
        return Flashcard.builder()
                .termOrQuestion(request.termOrQuestion().trim())
                .answerOrDate(request.answerOrDate().trim())
                .imageUrl(blankToNull(request.imageUrl()))
                .build();
    }

    private QuizletModule findModule(Long moduleId) {
        return moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Модуль не знайдено: " + moduleId));
    }
}
