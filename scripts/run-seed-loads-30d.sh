#!/usr/bin/env bash
set -euo pipefail

# scripts/run-seed-loads-30d.sh
# Runs loads seeding with Bun (preferred) or Node fallback

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
export NODE_ENV=development

if [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

COUNT=${COUNT:-40}
TTL_DAYS=${TTL_DAYS:-30}
PREFIX=${PREFIX:-LR}
START_NUM=${START_NUM:-2000}

ARGS=( --count "$COUNT" --ttlDays "$TTL_DAYS" --prefix "$PREFIX" --start "$START_NUM" )

if command -v bun >/dev/null 2>&1; then
  echo "Using Bun to run TypeScript seeder…"
  bun run scripts/seed-loads-30d.ts "${ARGS[@]}"
  exit $?
fi

if command -v node >/dev/null 2>&1; then
  echo "Using Node.js to run JS seeder…"
  node scripts/seed-loads-30d.js "${ARGS[@]}"
  exit $?
fi

echo "Neither Bun nor Node.js found on PATH." 1>&2
exit 1
