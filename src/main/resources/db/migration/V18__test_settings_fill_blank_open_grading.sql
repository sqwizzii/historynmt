-- Налаштування проведення тесту (старі тести зберігають попередню поведінку).
ALTER TABLE tests ADD COLUMN shuffle_questions BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tests ADD COLUMN shuffle_options BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tests ADD COLUMN max_attempts INTEGER;
ALTER TABLE tests ADD COLUMN available_from TIMESTAMP;
ALTER TABLE tests ADD COLUMN available_until TIMESTAMP;

-- Бали та чутливість регістру для FILL_BLANK / OPEN.
ALTER TABLE questions ADD COLUMN max_points INTEGER NOT NULL DEFAULT 1;
ALTER TABLE questions ADD COLUMN case_sensitive BOOLEAN NOT NULL DEFAULT FALSE;

-- Статус ручного оцінювання відкритих відповідей.
ALTER TABLE test_results ADD COLUMN grading_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE test_results ADD COLUMN teacher_comment TEXT;
ALTER TABLE test_results ADD COLUMN pending_manual_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX idx_test_results_grading_status ON test_results (grading_status);
