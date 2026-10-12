CREATE TABLE practice_fixes (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    question_id BIGINT NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    fixed_at TIMESTAMP NOT NULL,
    CONSTRAINT uq_practice_fix UNIQUE (student_id, question_id)
);
