package com.nmt.history.ai;

/** status: READY, TEACHER (є пояснення вчителя), NOT_NEEDED, NEEDS_REVIEW, UNAVAILABLE, RATE_LIMITED. */
public record ExplanationResponse(String status, String text, String message) {

    public static ExplanationResponse ready(String text) {
        return new ExplanationResponse("READY", text, null);
    }

    public static ExplanationResponse of(String status, String message) {
        return new ExplanationResponse(status, null, message);
    }
}
