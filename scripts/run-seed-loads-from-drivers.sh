#!/usr/bin/env bash
# scripts/run-seed-loads-from-drivers.sh
# Seeds loads that match driver pin locations with real US cities/states

set -e

echo "🚀 LoadRush: Seeding loads from driver locations..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Verify Firebase config
if [ -z "$EXPO_PUBLIC_FIREBASE_API_KEY" ]; then
  echo "❌ Error: EXPO_PUBLIC_FIREBASE_API_KEY not set in .env"
  exit 1
fi

if [ -z "$EXPO_PUBLIC_FIREBASE_PROJECT_ID" ]; then
  echo "❌ Error: EXPO_PUBLIC_FIREBASE_PROJECT_ID not set in .env"
  exit 1
fi

echo "✅ Firebase config verified"
echo "📍 Project: $EXPO_PUBLIC_FIREBASE_PROJECT_ID"
echo ""

# Run with Node.js (Bun has issues with Firebase)
if command -v node &> /dev/null; then
  echo "🟢 Using Node.js..."
  npx tsx scripts/seed-loads-from-drivers.ts
elif command -v bun &> /dev/null; then
  echo "🟠 Using Bun (may have compatibility issues)..."
  bun scripts/seed-loads-from-drivers.ts
else
  echo "❌ Error: Neither Node.js nor Bun found"
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✨ Done! Loads now match driver pin locations."
echo ""
echo "📱 Verify on iPad/Web:"
echo "   1. Open Command Center (Admin)"
echo "   2. Check driver pins on map"
echo "   3. Click driver → verify load cities match pin location"
echo "   4. Open Loads screen → verify origin/destination cities"
echo "   5. Loads persist for 30 days"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
