#!/bin/bash

echo "🚀 LoadRush Command Center Enhanced Driver Seeder"
echo "=================================================="
echo ""
echo "This script will:"
echo "  ✅ Seed 25 test drivers with accurate USA cities"
echo "  ✅ Assign real highway routes (I-45, I-10, I-95, etc.)"
echo "  ✅ Match coordinates to actual city positions"
echo "  ✅ Keep ALL drivers visible with blinking pins"
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

echo ""
echo "🔥 Starting seed process..."
echo ""

bun scripts/seed-command-center-v4.ts

echo ""
echo "✅ Done! Check your Command Center to see the drivers."
echo ""
