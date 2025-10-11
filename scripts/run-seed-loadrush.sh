#!/bin/bash

echo "🚀 Running LoadRush Data Seeding Script..."
echo ""

bun --bun scripts/seed-loadrush-data.ts

echo ""
echo "✅ Script execution complete!"
