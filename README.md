# НМТ Історія

Вебплатформа для підготовки до НМТ з історії України: тести у форматі НМТ (4 типи завдань, зображення в питаннях,
таймер, розбір відповідей), картки для запам'ятовування, кабінет учня та панель вчителя.

**Стек:** Java 17, Spring Boot 3.2.5 (Web, Data JPA, Security), PostgreSQL 16, Flyway, JWT (JJWT 0.12.5),
React 19, Vite, Tailwind CSS 4, Axios.

## Можливості

**Учень:** реєстрація, тести з таймером, результат за шкалою НМТ 100-200, розбір відповідей із поясненнями,
історія спроб і статистика (`/results`), картки з 3D-перевертанням, зміна пароля (`/account`).

**Вчитель** (`/teacher`): створення, редагування й видалення тестів, питань (4 типи, зображення, пояснення, ліміт часу
на тест) і модулів карток; список учнів з результатами та розбором кожної спроби; скидання пароля й видалення учня.

Реєстрація через сайт створює лише учнів. Акаунт вчителя створюється автоматично при першому запуску на порожній БД.

## Розгортання (Docker Compose + автоматичний HTTPS)

Потрібні: сервер із Docker, домен, DNS A-запис на сервер, відкриті порти 80 і 443.

```bash
cp .env.example .env
# заповніть .env: DOMAIN, DB_PASSWORD, JWT_SECRET (openssl rand -base64 48), BOOTSTRAP_TEACHER_PASSWORD
docker compose up -d --build
```

Сайт буде доступний на `https://<DOMAIN>`. Вхід вчителя: логін `teacher`, пароль із `BOOTSTRAP_TEACHER_PASSWORD`
(змінити в «Профілі» після першого входу). Застосунок у production-профілі **не стартує**, якщо не задано секрети.

Важливо: початковий вчитель створюється лише якщо його ще немає. Для нового клієнта використовуйте порожню БД
(у compose це новий том `pgdata`), не переносіть dev-базу.

> Файли розгортання (`Dockerfile`, `docker-compose.yml`, `frontend/nginx.conf`, `deploy/Caddyfile`) підготовлено,
> але на сервері з Docker ще не запускалися. Перший запуск варто зробити разом із клієнтом.

### Резервні копії

```bash
./scripts/backup.sh        # дамп у ./backups, зберігає останні 14
# приклад cron (щодня о 03:00): 0 3 * * * cd /opt/nmt-history && ./scripts/backup.sh
# відновлення:
gunzip -c backups/<файл>.sql.gz | docker compose exec -T db psql -U "$DB_USERNAME" nmt_history_db
```

Резервні копії варто копіювати за межі сервера.

### Оновлення

```bash
git pull && docker compose up -d --build
```

Схема БД оновлюється міграціями Flyway (`src/main/resources/db/migration`) автоматично при старті.

## Локальна розробка

Потрібні JDK 17+, Node 22+, PostgreSQL з базою `nmt_history_db`.

```bash
createdb nmt_history_db
export DB_USERNAME=postgres DB_PASSWORD=postgres
./mvnw spring-boot:run               # API на :8080, вчитель teacher / Teacher123!

cd frontend && npm install && npm run dev   # http://localhost:45173
```

Тести бекенду: `./mvnw test` (юніт- та інтеграційні тести на H2). Фронтенд: `npm run lint && npm run build`.

Змінні середовища (для dev усі мають значення за замовчуванням): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`,
`SERVER_PORT`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`, `BOOTSTRAP_TEACHER_*`,
`LOGIN_MAX_FAILURES`, `LOGIN_WINDOW_MINUTES`. Для фронтенду `VITE_API_URL` (dev: `http://localhost:8080/api`,
production-збірка: `/api`).

## Структура

```
src/main/java/com/nmt/history/
  config/       SecurityConfig, TeacherBootstrap
  security/     JwtUtils, JwtAuthenticationFilter, CustomUserDetailsService
  controller/   Auth, Account, Test, Quizlet, Result, Teacher
  service/      бізнес-логіка, ScoringService, NmtScoreConverter, ReviewService, LoginAttemptService
  dto/ model/ repository/ exception/
src/main/resources/db/migration/   міграції Flyway
frontend/src/  pages, components (tests, questions, quizlet, teacher), services/api.js, hooks, context
```

## Правила оцінювання

SINGLE_CHOICE: 1 бал. MULTIPLE_CHOICE: +1 за правильний вибір, -1 за зайвий (мінімум 0). MATCHING: 1 бал за пару.
CHRONOLOGY: 1 бал за повністю правильний ряд. Первинний бал переводиться в шкалу 100-200 **лінійно**
(`NmtScoreConverter`); це орієнтовна оцінка, а не офіційна таблиця переведення НМТ.

Формат даних питання: у MATCHING кожен варіант є елементом лівої колонки, а `matchKey` це його правильний відповідник;
у CHRONOLOGY `orderIndex` задає правильну позицію події.

## Обмеження

- Ліміт часу тесту перевіряється лише на стороні браузера; сервер його не контролює.
- Відновлення пароля через пошту не реалізовано: вчитель задає учневі новий пароль, учень змінює його в «Профілі».
- Шкала НМТ лінійна (див. вище). Базу питань потрібно наповнити вчителю.
- Блокування входу після невдалих спроб працює в пам'яті одного екземпляра застосунку й скидається при перезапуску.
