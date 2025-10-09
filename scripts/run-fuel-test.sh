#!/bin/bash

echo "🚀 Running Fuel Price API Validation Test..."
echo ""

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Run the test script with bun
bun run scripts/test-fuel-api-validation.ts
