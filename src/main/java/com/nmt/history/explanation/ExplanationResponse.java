package com.nmt.history.explanation;

/** status: STORED (збережене пояснення), TEACHER (пояснення з матеріалів питання), NOT_NEEDED, NONE (пояснення не додано). */
public record ExplanationResponse(String status, String text) {

    public static ExplanationResponse of(String status) {
        return new ExplanationResponse(status, null);
    }
}
