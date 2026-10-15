-- Лише структура зберігання. Платіжної інтеграції та обмежень доступу за підпискою поки немає.
CREATE TABLE subscriptions (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT      NOT NULL REFERENCES users (id),
    plan         VARCHAR(10) NOT NULL CHECK (plan IN ('MONTHLY', 'YEARLY')),
    status       VARCHAR(20) NOT NULL CHECK (status IN ('ACTIVE', 'CANCELLED')),
    starts_at    TIMESTAMP   NOT NULL,
    expires_at   TIMESTAMP   NOT NULL,
    cancelled_at TIMESTAMP,
    created_by   BIGINT REFERENCES users (id),
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions (user_id);
