#!/usr/bin/env bash
set -euo pipefail
CMD="bunx tsx scripts/seed-from-csv.ts"
echo "Running: $CMD"
$CMD
