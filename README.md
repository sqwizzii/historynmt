# НМТ Історія

Бекенд вебплатформи для підготовки до НМТ з історії України.

**Стек:** Java 17, Spring Boot 3.2.5 (Web, Data JPA, Security, Validation), PostgreSQL, Lombok, JJWT 0.12.5, Maven.

## Структура

```
src/main/java/com/nmt/history
├── NmtHistoryApplication.java
├── config/SecurityConfig.java      # базова security-конфігурація + PasswordEncoder
├── model/                          # JPA-сутності та enum-и (Role, QuestionType)
└── repository/                     # Spring Data JPA репозиторії
src/main/resources/application.yml  # підключення до nmt_history_db, JWT-налаштування
```

## Модель даних

`User` · `Test` 1—N `Question` 1—N `Option` · `QuizletModule` 1—N `Flashcard` · `TestResult` (N—1 `User`, N—1 `Test`)

## Запуск

```bash
createdb nmt_history_db            # або: CREATE DATABASE nmt_history_db;
export DB_USERNAME=postgres DB_PASSWORD=postgres
./mvnw spring-boot:run
```

Змінні середовища (усі мають значення за замовчуванням для локальної розробки):
`DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `SERVER_PORT`, `JWT_SECRET` (Base64, ≥256 біт), `JWT_EXPIRATION_MS`.

Схема таблиць створюється автоматично (`spring.jpa.hibernate.ddl-auto: update`).
