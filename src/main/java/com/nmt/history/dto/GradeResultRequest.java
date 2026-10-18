package com.nmt.history.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

/** Пакетне оцінювання відкритих відповідей і загальний коментар до результату. */
public record GradeResultRequest(
        @Valid List<GradeQuestionRequest> grades,
        @Size(max = 4000) String teacherComment,
        /** Якщо true — після збереження оцінок позначити результат як завершений (якщо не лишилось pending). */
        Boolean complete) {
}
