ALTER TABLE test_results ADD COLUMN late BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE test_results ADD COLUMN leave_count INT NOT NULL DEFAULT 0;
ALTER TABLE test_results ADD COLUMN end_reason VARCHAR(20);

CREATE TABLE test_attempts (
    id BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    test_id BIGINT NOT NULL REFERENCES tests (id) ON DELETE CASCADE,
    started_at TIMESTAMP NOT NULL,
    leave_count INT NOT NULL DEFAULT 0
);
CREATE INDEX idx_test_attempts_student_test ON test_attempts (student_id, test_id);

CREATE TABLE login_failures (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    attempted_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_login_failures_username ON login_failures (username, attempted_at);
