#!/bin/bash

echo "🚀 LoadRush Testing Setup"
echo "========================="
echo ""
echo "This script will:"
echo "  1. Seed 25 drivers with accurate city labels"
echo "  2. Seed 23 loads with 30-day persistence"
echo "  3. Verify the setup"
echo ""
echo "Press Ctrl+C to cancel, or wait 3 seconds to continue..."
sleep 3

echo ""
echo "📍 Step 1/3: Seeding Drivers..."
echo "================================"
bun scripts/seed-command-center-v4.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Driver seeding failed!"
  echo "Check your Firebase credentials in .env"
  exit 1
fi

echo ""
echo "📦 Step 2/3: Seeding Loads..."
echo "============================="
bun scripts/seed-loadrush-data.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "❌ Load seeding failed!"
  echo "Check your Firebase credentials in .env"
  exit 1
fi

echo ""
echo "🔍 Step 3/3: Verifying Setup..."
echo "================================"
bun scripts/verify-loadrush-setup.ts

if [ $? -ne 0 ]; then
  echo ""
  echo "⚠️  Verification completed with warnings"
  echo "Check the output above for details"
  exit 0
fi

echo ""
echo "=" | tr -d '\n' | head -c 60
echo ""
echo "🎉 SETUP COMPLETE!"
echo "=" | tr -d '\n' | head -c 60
echo ""
echo ""
echo "✅ Your LoadRush testing environment is ready!"
echo ""
echo "📱 Next Steps:"
echo "   1. Start the app: bun start"
echo "   2. Open on iPad/web"
echo "   3. Sign in as admin"
echo "   4. Navigate to Command Center"
echo "   5. Toggle to Map View"
echo "   6. Verify pins match city labels"
echo ""
echo "📖 For detailed testing instructions:"
echo "   - Quick start: QUICK_START_TESTING.md"
echo "   - Full guide: LOADRUSH_TESTING_GUIDE.md"
echo ""
echo "🎯 Success Criteria:"
echo "   ✓ 25 blinking pins visible"
echo "   ✓ City labels match pin positions"
echo "   ✓ Can toggle Dark/Map views"
echo "   ✓ Popups show correct data"
echo ""
echo "Happy Testing! 🚀"
echo ""
