package com.nmt.history.model;

/** Статус оцінювання результату тесту. */
public enum GradingStatus {
    /** Усі відповіді оцінено автоматично або вчителем. */
    COMPLETED,
    /** Є відкриті відповіді, що очікують ручної перевірки. */
    PENDING_REVIEW
}
