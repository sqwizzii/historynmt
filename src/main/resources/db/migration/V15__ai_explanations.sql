-- Збережені пояснення помилок від ШІ. Ключ: питання + відбиток його вмісту (правка питання робить пояснення
-- неактуальним) + відбиток конкретної неправильної відповіді. Лише успішні генерації; ніяких даних учнів тут немає.
CREATE TABLE ai_explanations (
    id           BIGSERIAL PRIMARY KEY,
    question_id  BIGINT       NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    content_hash VARCHAR(64)  NOT NULL,
    answer_hash  VARCHAR(64)  NOT NULL,
    explanation  TEXT         NOT NULL,
    model        VARCHAR(100),
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_ai_explanation UNIQUE (question_id, content_hash, answer_hash)
);
