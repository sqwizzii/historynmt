#!/usr/bin/env bash
# Резервна копія БД: ./scripts/backup.sh  (кладе стиснутий дамп у ./backups, зберігає останні 14)
set -euo pipefail
cd "$(dirname "$0")/.."
set -a; . ./.env; set +a
mkdir -p backups
FILE="backups/nmt_history_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose exec -T db pg_dump -U "$DB_USERNAME" nmt_history_db | gzip > "$FILE"
ls -1t backups/nmt_history_*.sql.gz | tail -n +15 | xargs -r rm --
echo "Збережено: $FILE"
