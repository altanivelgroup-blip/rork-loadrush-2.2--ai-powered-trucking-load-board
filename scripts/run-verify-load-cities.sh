#!/usr/bin/env bash
# scripts/run-verify-load-cities.sh
# Verifies loads match driver pin locations

set -e

echo "🔍 LoadRush: Verifying load cities..."
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Run verification
if command -v node &> /dev/null; then
  npx tsx scripts/verify-load-cities.ts
elif command -v bun &> /dev/null; then
  bun scripts/verify-load-cities.ts
else
  echo "❌ Error: Neither Node.js nor Bun found"
  exit 1
fi
