package com.nmt.history.model;

public enum QuestionType {
    SINGLE_CHOICE,
    MULTIPLE_CHOICE,
    MATCHING,
    CHRONOLOGY,
    /** Заповнення пропусків: варіанти — еталонні відповіді з orderIndex пропуску. */
    FILL_BLANK,
    /** Відкрита відповідь із ручним оцінюванням учителем. */
    OPEN
}
