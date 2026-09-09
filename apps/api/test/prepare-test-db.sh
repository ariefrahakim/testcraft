#!/usr/bin/env bash
# Menyiapkan database khusus test: buat ulang skema dari nol, lalu seed.
# Dipanggil otomatis oleh `npm run test:e2e`.
set -euo pipefail

CONTAINER="${TEST_DB_CONTAINER:-testcraft-lms-db}"
DB_NAME="${TEST_DB_NAME:-testcraft_test}"
DB_USER="${TEST_DB_USER:-testcraft}"
export DATABASE_URL="${TEST_DATABASE_URL:-postgresql://testcraft:testcraft@localhost:5433/${DB_NAME}?schema=public}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "✗ Container '${CONTAINER}' tidak berjalan. Jalankan: docker compose up -d" >&2
  exit 1
fi

echo "→ Menyiapkan database test '${DB_NAME}'…"
# Putuskan koneksi yang tersisa agar DROP tidak tertahan.
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -q -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${DB_NAME}' AND pid <> pg_backend_pid();" >/dev/null 2>&1 || true
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -q -c "DROP DATABASE IF EXISTS ${DB_NAME};"
docker exec "$CONTAINER" psql -U "$DB_USER" -d postgres -q -c "CREATE DATABASE ${DB_NAME};"

echo "→ Menerapkan migrasi…"
npx prisma migrate deploy >/dev/null

echo "→ Mengisi data awal…"
SEED_ADMIN_EMAIL=admin@testcraft.id SEED_ADMIN_PASSWORD='Admin#12345' \
  npx ts-node -P tsconfig.json prisma/seed.ts >/dev/null

echo "✓ Database test siap"
