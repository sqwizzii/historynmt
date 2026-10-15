-- Призначення тестів учням. Тест без жодного призначення доступний усім учням його вчителя (поведінка до цієї міграції);
-- щойно в тесту є призначення, його бачать лише призначені учні. Існуючі дані не змінюються.
CREATE TABLE test_assignments (
    id          BIGSERIAL PRIMARY KEY,
    test_id     BIGINT    NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
    student_id  BIGINT    NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_test_assignment UNIQUE (test_id, student_id)
);

CREATE INDEX idx_test_assignments_student ON test_assignments (student_id);
