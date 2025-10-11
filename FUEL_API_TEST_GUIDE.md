# 🚀 Fuel API Integration Test Guide

## Overview
This guide helps you test the Fuel API integration in Loadrush across iOS, Android, and Web platforms.

## Test Scripts Created

### 1. **fuel-api-test.js** (Node.js - Cross-platform)
- ✅ Tests both ZYLA and Alternative APIs
- ✅ Works on any platform (iOS, Android, Web, Desktop)
- ✅ No React Native dependencies
- ✅ Detailed logging and error reporting

**Run it:**
```bash
# Option 1: Direct
node scripts/fuel-api-test.js

# Option 2: With .env loading
bash scripts/run-fuel-test.sh

# Option 3: With environment variables
FUEL_API_KEY=your_key node scripts/fuel-api-test.js
```

### 2. **test-fuel-integration.ts** (TypeScript - React Native)
- ✅ Tests react-native-dotenv integration
- ✅ Validates environment variables
- ✅ Tests both API endpoints
- ✅ Data structure validation

**Run it:**
```bash
# Add to your app temporarily
# Import and call in app/index.tsx or create a test screen
```

### 3. **test-fuel-ui.tsx** (React Component - UI Test)
- ✅ Visual test component
- ✅ Tests useFuelPrices hook
- ✅ Tests direct fuelService calls
- ✅ Real-time status indicators
- ✅ Retry buttons for manual testing

**Use it:**
```typescript
// Add to your app as a test screen
// app/(driver)/fuel-test.tsx
import FuelUITest from '@/scripts/test-fuel-ui';
export default FuelUITest;
```

## Current API Configuration

### ZYLA API (react-native-dotenv)
```env
FUEL_API_URL=https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs
FUEL_API_KEY=[YOUR_ACTUAL_API_KEY]  # ⚠️ NEEDS REAL KEY
```

### Alternative API (EXPO_PUBLIC)
```env
EXPO_PUBLIC_FUEL_API=https://api.fuelpricestracker.com/fuel-costs
EXPO_PUBLIC_FUEL_KEY=10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU
```

## Testing Checklist

### ✅ Pre-Test Setup
- [ ] Verify .env file exists with API keys
- [ ] Restart Expo dev server: `npx expo start --clear`
- [ ] Check babel.config.js has react-native-dotenv plugin
- [ ] Verify network connectivity

### ✅ Node.js Test (Quick Check)
```bash
node scripts/fuel-api-test.js
```

**Expected Output:**
```
✅ Test 1: ZYLA API - PASSED or FAILED
✅ Test 2: Alternative API - PASSED or FAILED
📊 Results: X/2 tests passed
```

### ✅ iOS Simulator Test
1. Start Expo: `npx expo start`
2. Press `i` for iOS simulator
3. Navigate to Driver Dashboard
4. Check Fuel Price Card:
   - [ ] Shows loading state initially
   - [ ] Displays price after loading
   - [ ] Price is NOT $3.89 (fallback) if API works
   - [ ] Shows "Updated Xm ago" timestamp
   - [ ] Refresh button works (30s cooldown)

**Check Console Logs:**
```
⛽ Fetching diesel prices from FuelPricesTracker API
📡 Fuel API Response Status: 200
✅ Fuel API Data received: {...}
```

### ✅ Android Simulator Test
1. Start Expo: `npx expo start`
2. Press `a` for Android simulator
3. Same checks as iOS above

### ✅ Web Test
1. Start Expo: `npx expo start`
2. Press `w` for web
3. Open browser console (F12)
4. Same checks as iOS above

**Web-Specific Checks:**
- [ ] No CORS errors in console
- [ ] Fetch API works (not blocked)
- [ ] No hydration errors
- [ ] No black screen issues

## Common Issues & Fixes

### ❌ Issue: "API key is placeholder"
**Fix:**
1. Get real API key from https://zylalabs.com/
2. Update .env: `FUEL_API_KEY=your_real_key`
3. Restart: `npx expo start --clear`

### ❌ Issue: "HTTP 401 Unauthorized"
**Fix:**
1. Verify API key is correct
2. Check if key has expired
3. Try alternative API endpoint

### ❌ Issue: "HTTP 403 Forbidden"
**Fix:**
1. Check API rate limits
2. Verify API subscription is active
3. Try again after a few minutes

### ❌ Issue: "Network request failed"
**Fix:**
1. Check internet connection
2. Try on different network (WiFi vs cellular)
3. Check if API endpoint is accessible (curl test)

### ❌ Issue: "Always shows $3.89 (fallback price)"
**Fix:**
1. API call is failing silently
2. Check console logs for errors
3. Run node test script to diagnose
4. Verify environment variables are loaded

### ❌ Issue: "Black screen on app start"
**Fix:**
1. Remove 2-second delay in fuelService.ts (line 36)
2. Make fuel fetch non-blocking
3. Use React Query's background refetch

### ❌ Issue: "Environment variables not found"
**Fix:**
1. Verify babel.config.js has dotenv plugin
2. Restart Expo with --clear flag
3. Check .env file is in root directory
4. Verify import: `import { FUEL_API_KEY } from '@env'`

## Expected Behavior

### ✅ Working Integration
- Fuel Price Card shows real prices (not $3.89/$3.45)
- Prices update every 6 hours automatically
- Manual refresh works with 30s cooldown
- Console shows successful API calls
- No errors in console
- Works on iOS, Android, and Web

### ⚠️ Partial Integration
- Shows fallback prices ($3.89/$3.45)
- Console shows API errors but app doesn't crash
- Refresh button works but returns same fallback
- Warning banner: "Using estimated price"

### ❌ Broken Integration
- Black screen on app start
- App crashes when loading dashboard
- Console shows unhandled errors
- Fuel Price Card doesn't render

## Performance Benchmarks

### API Response Times
- **Good:** < 1 second
- **Acceptable:** 1-3 seconds
- **Slow:** > 3 seconds (consider caching)

### App Load Times
- **Good:** < 2 seconds to dashboard
- **Acceptable:** 2-4 seconds
- **Slow:** > 4 seconds (remove delays)

## Debugging Commands

### Check Environment Variables
```bash
# In Node.js
node -e "console.log(process.env.FUEL_API_KEY)"

# In Expo
# Add to app: console.log(process.env.EXPO_PUBLIC_FUEL_KEY)
```

### Test API with curl
```bash
# ZYLA API
curl -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     "https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs"

# Alternative API
curl -H "Authorization: Bearer 10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU" \
     -H "Content-Type: application/json" \
     "https://api.fuelpricestracker.com/fuel-costs"
```

### Check React Query Cache
```typescript
// In your component
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log('Fuel cache:', queryClient.getQueryData(['fuel', 'getPrices']));
```

## Success Criteria

### ✅ All Tests Pass
- [ ] Node.js test script passes
- [ ] iOS shows real fuel prices
- [ ] Android shows real fuel prices
- [ ] Web shows real fuel prices
- [ ] No console errors
- [ ] Refresh button works
- [ ] Prices update automatically
- [ ] No black screens or crashes
- [ ] Performance is acceptable (< 3s load)

## Next Steps After Testing

### If All Tests Pass ✅
1. Remove test scripts (optional)
2. Deploy to production
3. Monitor API usage and costs
4. Set up error tracking (Sentry)
5. Add analytics for fuel price views

### If Some Tests Fail ⚠️
1. Identify which platform fails
2. Check platform-specific issues
3. Use fallback API if primary fails
4. Add better error handling
5. Implement retry logic

### If All Tests Fail ❌
1. Verify API keys are valid
2. Check API service status
3. Test with curl/Postman
4. Contact API provider support
5. Use mock data temporarily

## Support

### API Provider Support
- **ZYLA:** https://zylalabs.com/support
- **Alternative API:** Check their documentation

### Loadrush Support
- Check console logs first
- Run test scripts for diagnostics
- Review this guide for common issues
- Contact development team with logs

---

**Last Updated:** 2025-10-11
**Version:** 1.0.0
**Status:** Ready for Testing
