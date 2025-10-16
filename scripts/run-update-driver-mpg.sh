#!/bin/bash

echo "🚀 Updating driver MPG values in Firestore..."
echo ""

if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  exit 1
fi

export $(cat .env | grep -v '^#' | xargs)

bun run scripts/update-driver-mpg.ts

echo ""
echo "✅ Script complete!"
