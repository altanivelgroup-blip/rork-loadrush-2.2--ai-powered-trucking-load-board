#!/bin/bash

echo "🚀 LoadRush - Adding Realistic Drivers"
echo "======================================"
echo ""
echo "This script will add 20 new drivers with realistic US locations"
echo "to your Firebase database for Command Center testing."
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

cd "$(dirname "$0")/.."

echo ""
echo "📦 Running script..."
echo ""

bun run scripts/add-realistic-drivers.ts

echo ""
echo "✅ Done! Check your Admin Command Center to see the new drivers."
echo ""
