#!/bin/bash
cd "$(dirname "$0")/.."
export EXPO_PUBLIC_FUEL_API="https://api.fuelpricestracker.com/fuel-costs"
export EXPO_PUBLIC_FUEL_KEY="10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU"
node -e "$(cat scripts/verify-fuel-connection.ts | sed 's/^//' | sed 's/process\.env\./process.env./g')"
