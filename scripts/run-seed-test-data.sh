#!/bin/bash

echo "🚀 LoadRush Test Data Seeder"
echo "=============================="
echo ""
echo "This script will:"
echo "  1. Clear existing test data"
echo "  2. Create 15 test drivers with varied statuses"
echo "  3. Create 15 test loads with varied routes"
echo ""
echo "⚠️  WARNING: This will delete ALL existing drivers and loads!"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "🔥 Starting seed process..."
echo ""

npx tsx scripts/seed-test-data.ts
