package com.nmt.history.exception;

public class TooManyRequestsException extends RuntimeException {

    public TooManyRequestsException(String message) {
        super(message);
    }
}
