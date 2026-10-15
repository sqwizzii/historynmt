#!/usr/bin/env bash
# Створює файл .env з випадковими паролями. Використання: ./scripts/make-env.sh history.example.com
set -euo pipefail
cd "$(dirname "$0")/.."
DOMAIN_NAME="${1:?Вкажіть домен, напр.: ./scripts/make-env.sh history.example.com}"
if [ -f .env ]; then
  echo ".env уже існує, нічого не змінено." >&2
  exit 1
fi
TEACHER_PASSWORD="$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-14)Aa1!"
cat > .env <<ENV
DOMAIN=${DOMAIN_NAME}
PUBLIC_URL=https://${DOMAIN_NAME}
POSTGRES_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -base64 48 | tr -d '\n')
BOOTSTRAP_TEACHER_ENABLED=true
BOOTSTRAP_TEACHER_PASSWORD=${TEACHER_PASSWORD}
ENV
chmod 600 .env
echo "Створено .env. Логін вчителя: teacher, пароль: ${TEACHER_PASSWORD}"
echo "Збережіть пароль і змініть його після першого входу."
