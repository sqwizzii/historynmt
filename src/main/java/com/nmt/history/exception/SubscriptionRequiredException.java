package com.nmt.history.exception;

/** Потрібна активна підписка вчителя (HTTP 402). */
public class SubscriptionRequiredException extends RuntimeException {

    public SubscriptionRequiredException(String message) {
        super(message);
    }
}
