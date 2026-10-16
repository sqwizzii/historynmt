-- Режим показу правильних відповідей. Старі тести зберігають поведінку: розбір після завершення тесту.
ALTER TABLE tests ADD COLUMN answer_visibility_mode VARCHAR(30) NOT NULL DEFAULT 'AFTER_TEST_COMPLETION';

-- Відповіді, які учень уже перевірив у режимі «після кожного питання». Після перевірки відповідь зафіксована
-- й саме її сервер використовує при підрахунку, тож правильну відповідь не можна підглянути й змінити.
CREATE TABLE attempt_answers (
    id          BIGSERIAL PRIMARY KEY,
    attempt_id  BIGINT    NOT NULL REFERENCES test_attempts (id) ON DELETE CASCADE,
    question_id BIGINT    NOT NULL,
    answer_json TEXT      NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_attempt_answer UNIQUE (attempt_id, question_id)
);
