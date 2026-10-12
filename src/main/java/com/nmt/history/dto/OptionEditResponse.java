package com.nmt.history.dto;

/** Варіант відповіді для вчителя: з ознакою правильності, matchKey та позицією. */
public record OptionEditResponse(Long id, String optionText, boolean isCorrect, String matchKey, Integer orderIndex) {
}
