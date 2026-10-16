-- Додаткові зображення питання (після головного questions.image_url) зі збереженням порядку.
CREATE TABLE question_images (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT  NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    image_url   TEXT    NOT NULL
);
CREATE INDEX idx_question_images_question ON question_images (question_id, position);

-- Зайві варіанти правої колонки (дистрактори) завдань на відповідність: варіанти, які не є правильним
-- відповідником жодного рядка. Правильні відповідники й надалі лежать у options.match_key.
CREATE TABLE question_match_choices (
    id          BIGSERIAL PRIMARY KEY,
    question_id BIGINT  NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
    position    INTEGER NOT NULL,
    choice_text TEXT    NOT NULL
);
CREATE INDEX idx_question_match_choices_question ON question_match_choices (question_id, position);
