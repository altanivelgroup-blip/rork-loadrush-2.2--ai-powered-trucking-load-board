#!/usr/bin/env bash
set -euo pipefail
CMD="bunx tsx scripts/verify-vegas-data.ts"
echo "Running: $CMD"
$CMD
