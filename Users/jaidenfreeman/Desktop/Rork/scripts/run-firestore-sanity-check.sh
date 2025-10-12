#!/bin/bash

echo "🔍 Running Firestore Sanity Check..."
echo ""

cd "$(dirname "$0")/.."

bun run scripts/firestore-sanity-check.ts
