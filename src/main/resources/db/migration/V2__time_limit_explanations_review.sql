ALTER TABLE tests ADD COLUMN time_limit_minutes INTEGER NOT NULL DEFAULT 60;
ALTER TABLE questions ADD COLUMN explanation TEXT;
ALTER TABLE test_results ADD COLUMN review_json TEXT;
