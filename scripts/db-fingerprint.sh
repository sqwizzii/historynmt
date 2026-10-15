#!/usr/bin/env bash
# Відбиток вмісту БД для порівняння до/після міграції чи відновлення з копії.
# Використання: scripts/db-fingerprint.sh <назва_бази> [хост] [користувач]
# Підключення бере пароль зі змінної PGPASSWORD. База лише читається.
set -euo pipefail
DB="${1:?Вкажіть назву бази}"
HOST="${2:-localhost}"
USER_NAME="${3:-postgres}"
PSQL=(psql -h "$HOST" -U "$USER_NAME" -d "$DB" -At -v ON_ERROR_STOP=1)

row_hash() {
  # хеш усіх рядків таблиці за вказаними колонками (колонки, додані пізніше, у відбиток не входять)
  "${PSQL[@]}" -c "select md5(coalesce(string_agg(t::text, '|' order by t.id), '')) from (select $2 from $1) t"
}

echo "table|rows|md5(original columns)"
declare -A COLS=(
  [users]="id, username, email, password, role, first_name, last_name"
  [tests]="id, title, description, time_limit_minutes, created_at"
  [questions]="id, test_id, question_text, question_type, explanation, topic"
  [options]="id, question_id, option_text, is_correct, match_key, order_index"
  [test_results]="id, student_id, test_id, score, nmt_score, review_json, late, leave_count, end_reason, completed_at"
  [test_attempts]="id, student_id, test_id, started_at"
  [quizlet_modules]="id, title, description"
  [flashcards]="id, module_id, term_or_question, answer_or_date"
  [practice_fixes]="id, student_id, question_id"
  [app_settings]="setting_key as id, setting_value"
)
for table in users tests questions options test_results test_attempts quizlet_modules flashcards practice_fixes app_settings; do
  if "${PSQL[@]}" -c "select to_regclass('public.$table')" | grep -q "$table"; then
    source="$table"
    [ "$table" = app_settings ] && source="app_settings where setting_key <> 'legacy_ownership_done'"
    count=$("${PSQL[@]}" -c "select count(*) from $source")
    hash=$(row_hash "$source" "${COLS[$table]}" 2>/dev/null || echo "n/a")
    echo "$table|$count|$hash"
  fi
done
echo "--- foreign keys without a parent row (має бути 0):"
"${PSQL[@]}" -c "
select 'test_results.student', count(*) from test_results r left join users u on u.id=r.student_id where u.id is null
union all select 'test_results.test', count(*) from test_results r left join tests t on t.id=r.test_id where t.id is null
union all select 'questions.test', count(*) from questions q left join tests t on t.id=q.test_id where t.id is null
union all select 'options.question', count(*) from options o left join questions q on q.id=o.question_id where q.id is null"
