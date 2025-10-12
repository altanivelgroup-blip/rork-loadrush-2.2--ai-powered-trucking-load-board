#!/bin/bash

echo "🚀 LoadRush Command Center v3 Driver Seeding"
echo "=============================================="
echo ""

if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

echo "📦 Running seed script..."
bun run scripts/seed-command-center-v3.ts

echo ""
echo "✨ Seeding complete!"
