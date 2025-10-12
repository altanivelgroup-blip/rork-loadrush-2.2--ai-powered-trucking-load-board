#!/bin/bash

echo "🚀 Adding test loads for driver and shipper..."
echo ""

bun run scripts/add-test-loads-for-users.ts

echo ""
echo "✅ Done! Check your Driver Loads and Shipper My Loads pages."
