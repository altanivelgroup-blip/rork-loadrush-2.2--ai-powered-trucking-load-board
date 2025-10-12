#!/bin/bash

echo "🔍 LoadRush Setup Verification"
echo "=============================="
echo ""
echo "This will verify:"
echo "  ✓ Drivers are seeded correctly"
echo "  ✓ Loads have 30-day persistence"
echo "  ✓ City labels match pin positions"
echo ""

bun scripts/verify-loadrush-setup.ts

echo ""
