# 🚀 Test Fuel API Integration NOW

## Quick Start (30 seconds)

### Run This Command:
```bash
node scripts/fuel-api-test.js
```

### What You'll See:
```
🚀 ========================================
🚀 FUEL API INTEGRATION TEST
🚀 ========================================

📋 Testing: ZYLA API
✅ SUCCESS! or ❌ FAILED

📋 Testing: Alternative API  
✅ SUCCESS! or ❌ FAILED

📊 Results: X/2 tests passed
```

## What the Test Does

1. ✅ Checks environment variables
2. ✅ Tests ZYLA API endpoint
3. ✅ Tests Alternative API endpoint
4. ✅ Shows response data
5. ✅ Gives recommendations

## Expected Results

### ✅ Best Case (2/2 passed)
```
✅ Test 1: ZYLA API - PASSED
✅ Test 2: Alternative API - PASSED
🎉 ALL TESTS PASSED!
```
**Action:** Deploy to production, everything works!

### ⚠️ Good Case (1/2 passed)
```
❌ Test 1: ZYLA API - FAILED (placeholder key)
✅ Test 2: Alternative API - PASSED
⚠️ PARTIAL SUCCESS
```
**Action:** Use Alternative API, it's working fine!

### ❌ Bad Case (0/2 passed)
```
❌ Test 1: ZYLA API - FAILED
❌ Test 2: Alternative API - FAILED
❌ ALL TESTS FAILED
```
**Action:** Check network, API keys, and try again

## Test in Your App

### 1. Start Expo
```bash
npx expo start --clear
```

### 2. Open App
- Press `i` for iOS
- Press `a` for Android  
- Press `w` for Web

### 3. Navigate to Driver Dashboard

### 4. Check Fuel Price Card
Look for:
- ✅ Shows price (not $3.89 fallback)
- ✅ "Updated Xm ago" timestamp
- ✅ Refresh button works
- ✅ No errors in console

### 5. Check Console Logs
Look for:
```
⛽ Fetching diesel prices from FuelPricesTracker API
📡 Fuel API Response Status: 200
✅ Fuel API Data received
```

## Troubleshooting

### Problem: "Cannot find module '@env'"
**Fix:** This is expected in Node.js test, ignore it

### Problem: "All tests failed"
**Fix:** 
1. Check internet connection
2. Verify .env file exists
3. Try: `bash scripts/run-fuel-test.sh`

### Problem: "Shows $3.89 in app"
**Fix:**
1. API is using fallback
2. Check console for errors
3. Run node test to diagnose

### Problem: "Black screen"
**Fix:**
1. Remove delay in services/fuelService.ts line 36
2. Restart Expo: `npx expo start --clear`

## Files to Check

### 1. Environment Variables (.env)
```env
EXPO_PUBLIC_FUEL_API=https://api.fuelpricestracker.com/fuel-costs
EXPO_PUBLIC_FUEL_KEY=10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU
```

### 2. Backend Route
`backend/trpc/routes/fuel/get-prices/route.ts`
- Uses EXPO_PUBLIC_FUEL_API
- Returns fallback on error

### 3. Frontend Hook
`hooks/useFuelPrices.ts`
- Calls tRPC endpoint
- 6-hour cache

### 4. UI Component
`components/FuelPriceCard.tsx`
- Shows in Driver Dashboard
- Has refresh button

## Success Checklist

- [ ] Node test passes (1/2 or 2/2)
- [ ] iOS shows real price
- [ ] Android shows real price
- [ ] Web shows real price
- [ ] No console errors
- [ ] Refresh works
- [ ] No black screens

## Get Help

### Check Logs
```bash
# Run test and save output
node scripts/fuel-api-test.js > test-results.txt 2>&1

# View results
cat test-results.txt
```

### Test with curl
```bash
curl -H "Authorization: Bearer 10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU" \
     -H "Content-Type: application/json" \
     "https://api.fuelpricestracker.com/fuel-costs"
```

### Read Full Guide
See `FUEL_API_TEST_GUIDE.md` for complete documentation

---

**Ready?** Run: `node scripts/fuel-api-test.js`
