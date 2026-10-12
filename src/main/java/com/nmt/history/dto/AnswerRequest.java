package com.nmt.history.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * Відповідь учня на одне питання. Заповнюється те поле, що відповідає типу питання:
 * <ul>
 *   <li>SINGLE_CHOICE / MULTIPLE_CHOICE - {@code selectedOptionIds}</li>
 *   <li>MATCHING - {@code matches}: id варіанта (елемент лівої колонки) -> обраний matchKey</li>
 *   <li>CHRONOLOGY - {@code orderedOptionIds}: id варіантів у порядку, який запропонував учень</li>
 * </ul>
 */
public record AnswerRequest(
        @NotNull Long questionId,
        List<Long> selectedOptionIds,
        Map<Long, String> matches,
        List<Long> orderedOptionIds) {
}
