#!/bin/bash

echo "🚀 Starting Fuel API Integration Test..."
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found"
fi

# Run the test
node scripts/fuel-api-test.js

echo ""
echo "✅ Test script completed!"
