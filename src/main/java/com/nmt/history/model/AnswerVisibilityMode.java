package com.nmt.history.model;

/** Коли учню дозволено бачити правильні відповіді та пояснення. Для старих тестів діє AFTER_TEST_COMPLETION. */
public enum AnswerVisibilityMode {
    AFTER_EACH_QUESTION,
    AFTER_TEST_COMPLETION,
    NEVER
}
