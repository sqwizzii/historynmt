#!/usr/bin/env bash
# Резервна копія бази даних. Запускайте з каталогу проєкту, напр. щоночі через cron:
#   0 3 * * * /шлях/до/проєкту/scripts/backup.sh
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p backups
FILE="backups/nmt_history_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose exec -T db pg_dump -U nmt nmt_history_db | gzip > "$FILE"
find backups -name 'nmt_history_*.sql.gz' -mtime +30 -delete
echo "Збережено $FILE"
