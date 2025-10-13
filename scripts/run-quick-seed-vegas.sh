#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Running Vegas Data Seeding..."
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Run the seeding script
node scripts/quick-seed-vegas.js

echo ""
echo "✅ Done! Check your Firestore console to verify the data."
