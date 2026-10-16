package com.nmt.history.ai;

/** Результат звернення до ШІ: або текст, або категорія збою з діагностикою (без секретів). */
public record AiResult(String text, Failure failure, Integer status, String providerMessage) {

    public enum Failure { NOT_CONFIGURED, AUTH, NOT_FOUND, RATE_LIMITED, BAD_REQUEST, SERVER_ERROR, TIMEOUT, NETWORK, BAD_RESPONSE, TRUNCATED }

    public static AiResult ok(String text) {
        return new AiResult(text, null, null, null);
    }

    public static AiResult failed(Failure failure, Integer status, String providerMessage) {
        return new AiResult(null, failure, status, providerMessage);
    }

    public boolean isOk() {
        return text != null;
    }
}
