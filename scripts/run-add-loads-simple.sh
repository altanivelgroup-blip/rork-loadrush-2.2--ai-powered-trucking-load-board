#!/bin/bash

echo "🚀 Adding test loads for driver and shipper..."
echo ""

cd "$(dirname "$0")/.."
bun run scripts/add-loads-simple.ts

echo ""
echo "✅ Done! Check your iPad app now."
