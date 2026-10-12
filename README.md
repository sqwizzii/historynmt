# НМТ Історія

Бекенд вебплатформи для підготовки до НМТ з історії України.

**Стек:** Java 17, Spring Boot 3.2.5 (Web, Data JPA, Security, Validation), PostgreSQL, Lombok, JJWT 0.12.5, Maven.

## Фронтенд

React 19 + Vite + Tailwind CSS 4 + Lucide React + Axios + React Router, каталог `frontend/`.

```bash
cd frontend
npm install
npm run dev        # http://localhost:45173
```

Базовий URL API - `http://localhost:8080/api` (змінюється через `VITE_API_URL`, див. `frontend/.env.example`).
Бекенд дозволяє CORS для origin-ів із `app.cors.allowed-origins` (змінна `CORS_ALLOWED_ORIGINS`).

- `src/services/api.js` - Axios з інтерцептором `Authorization: Bearer <token>` і сервіси `authService`, `testService`, `quizletService`, `resultService`.
- `src/context/AuthContext.jsx` - стан користувача, токен і дані користувача зберігаються в `localStorage` (`token`, `user`).
- `src/components/Header.jsx` - шапка з навігацією, користувачем/роллю та виходом.
- `src/pages/Login.jsx`, `src/pages/Register.jsx` - вхід і реєстрація з вибором ролі.

## Структура бекенду

```
src/main/java/com/nmt/history
├── NmtHistoryApplication.java
├── config/SecurityConfig.java      # правила доступу, stateless JWT, PasswordEncoder
├── security/                       # JwtUtils, JwtAuthenticationFilter, CustomUserDetailsService
├── controller/                     # REST-контролери
├── service/                        # бізнес-логіка, підрахунок балів (ScoringService, NmtScoreConverter)
├── dto/                            # запити/відповіді API (records)
├── exception/                      # власні винятки + GlobalExceptionHandler
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

## API

| Метод і шлях | Доступ | Опис |
|---|---|---|
| `POST /api/auth/register`, `POST /api/auth/login` | публічно | повертає `{token, tokenType, username, role}` |
| `GET /api/tests`, `GET /api/tests/{id}` | публічно | список тестів / структура тесту (без правильних відповідей) |
| `GET /api/quizlet`, `GET /api/quizlet/{id}` | публічно | модулі з картками |
| `POST /api/tests/{id}/submit` | STUDENT, TEACHER | проходження тесту, повертає бали |
| `GET /api/results/my` | STUDENT, TEACHER | власні результати |
| `POST /api/tests/create`, `POST /api/tests/questions/create` | TEACHER | створення тесту / питання з варіантами |
| `POST /api/quizlet/create`, `POST /api/quizlet/{id}/cards` | TEACHER | створення модуля (опційно з картками) / додавання картки |
| `GET /api/teacher/results` | TEACHER | результати всіх учнів |

Токен передається заголовком `Authorization: Bearer <token>`.

### Формат відповідей на питання (`POST /api/tests/{id}/submit`)

```json
{ "answers": [
  { "questionId": 1, "selectedOptionIds": [3] },
  { "questionId": 2, "selectedOptionIds": [4, 5] },
  { "questionId": 3, "matches": { "7": "1648", "8": "1569" } },
  { "questionId": 4, "orderedOptionIds": [9, 10, 11] }
] }
```

Як задавати варіанти при створенні питання:
- `SINGLE_CHOICE` - рівно один `isCorrect: true`; `MULTIPLE_CHOICE` - один або більше.
- `MATCHING` - кожен варіант це елемент лівої колонки, `matchKey` - його правильний відповідник (права колонка).
- `CHRONOLOGY` - `orderIndex` задає правильну позицію події (унікальні значення).

### Нарахування балів

SINGLE_CHOICE - 1 бал; MULTIPLE_CHOICE - +1 за правильний вибір, -1 за зайвий (мінімум 0); MATCHING - 1 бал за пару;
CHRONOLOGY - 1 бал за повністю правильний ряд. Первинний бал переводиться лінійно в шкалу 100-200
(`NmtScoreConverter`).
