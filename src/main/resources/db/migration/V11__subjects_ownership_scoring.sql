-- Етап 2: предмети, клас, власність матеріалів, шкала оцінювання. Лише додавання: існуючі дані не змінюються й не видаляються.
-- owner_id = NULL означає загальноплатформний (системний) матеріал. Власників старих даних призначає
-- LegacyOwnershipInitializer лише за явною конфігурацією, а не ця міграція.

CREATE TABLE subjects (
    id         BIGSERIAL PRIMARY KEY,
    slug       VARCHAR(60)  NOT NULL UNIQUE,
    name       VARCHAR(120) NOT NULL,
    sort_order INTEGER      NOT NULL DEFAULT 0,
    active     BOOLEAN      NOT NULL DEFAULT TRUE
);

INSERT INTO subjects (slug, name, sort_order) VALUES
    ('ukrainian-history', 'Історія України', 10),
    ('world-history', 'Всесвітня історія', 20),
    ('ukrainian-language', 'Українська мова', 30),
    ('ukrainian-literature', 'Українська література', 40),
    ('mathematics', 'Математика та алгебра', 50),
    ('geometry', 'Геометрія', 60),
    ('foreign-languages', 'Іноземні мови', 70),
    ('geography', 'Географія', 80),
    ('biology', 'Біологія', 90),
    ('physics', 'Фізика', 100),
    ('chemistry', 'Хімія', 110),
    ('informatics', 'Інформатика', 120);

ALTER TABLE users
    ADD COLUMN teacher_id BIGINT REFERENCES users (id),
    ADD COLUMN legacy_free_access BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE tests
    ADD COLUMN owner_id BIGINT REFERENCES users (id),
    ADD COLUMN subject_id BIGINT REFERENCES subjects (id),
    ADD COLUMN grade INTEGER CHECK (grade BETWEEN 1 AND 11),
    ADD COLUMN scoring_scale VARCHAR(10) NOT NULL DEFAULT 'NMT';

ALTER TABLE quizlet_modules
    ADD COLUMN owner_id BIGINT REFERENCES users (id),
    ADD COLUMN subject_id BIGINT REFERENCES subjects (id),
    ADD COLUMN grade INTEGER CHECK (grade BETWEEN 1 AND 11);

CREATE INDEX idx_users_teacher_id ON users (teacher_id);
CREATE INDEX idx_tests_owner_id ON tests (owner_id);
CREATE INDEX idx_tests_subject_id ON tests (subject_id);
CREATE INDEX idx_modules_owner_id ON quizlet_modules (owner_id);
CREATE INDEX idx_modules_subject_id ON quizlet_modules (subject_id);

-- Усі наявні матеріали створювались для підготовки до НМТ з історії України.
UPDATE tests SET subject_id = (SELECT id FROM subjects WHERE slug = 'ukrainian-history');
UPDATE quizlet_modules SET subject_id = (SELECT id FROM subjects WHERE slug = 'ukrainian-history');
