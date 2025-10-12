# Quick Access Testing Guide

## ✅ What Was Fixed

### 1. Quick Access Buttons Added
- **Driver Quick Access**: Auto-signs in with `driver@loadrush.co`
- **Shipper Quick Access**: Auto-signs in with `shipper@loadrush.co`
- Located on login screen (only visible when NOT in sign-up mode)
- Green button for Driver, Orange button for Shipper

### 2. tRPC Fetch Error Fixes
- **Increased retries**: 8 → 10 attempts for tRPC client
- **Longer timeouts**: 60s → 90s for requests
- **Better backoff**: Exponential delay up to 15s (was 10s)
- **401 handling**: Auto-retry with fresh auth token on auth failures
- **More status codes**: Now retries on 502, 503 in addition to 500, 429, 408

### 3. Routing API Improvements
- **More retries**: 4 → 6 attempts for ORS API
- **Longer timeout**: 45s → 60s per request
- **Better error handling**: Network/timeout errors trigger automatic retry
- **Fallback route**: Always returns straight-line calculation if API fails
- **No crashes**: All errors caught and handled gracefully

### 4. Fuel Price Fixes
- **More retries**: 5 → 8 attempts in hook, 5 → 7 in backend
- **Longer timeout**: 20s → 30s for fuel API
- **Network mode**: Set to 'always' to work on iPad
- **Better fallbacks**: State-specific prices, then national average
- **No "stuck" states**: Shows fallback immediately if API fails

---

## 🧪 How to Test on iPad

### Step 1: Open the App
1. Scan QR code on your iPad
2. Wait for app to load (should see LoadRush logo)

### Step 2: Use Quick Access
1. On login screen, scroll down to see "Quick Access (Testing)" section
2. Tap **Driver** button (green) to sign in as driver
3. OR tap **Shipper** button (orange) to sign in as shipper
4. Wait 2-3 seconds for authentication

### Step 3: Verify Driver Dashboard
After signing in as driver, check:
- ✅ Dashboard loads without errors
- ✅ Fuel price shows (not "Fetching live..." forever)
- ✅ No GPS coordinates visible (should be hidden)
- ✅ No tRPC fetch errors in console

### Step 4: Verify Command Center (Admin)
1. Long-press the logo on login screen to access admin
2. Navigate to Command Center
3. Check:
   - ✅ All drivers visible on map
   - ✅ Lights blinking on driver pins
   - ✅ Routes load when clicking drivers
   - ✅ No "Failed to fetch" errors
   - ✅ ETAs and cities display correctly

### Step 5: Test Simulation
1. In Command Center, start simulation
2. Verify:
   - ✅ Drivers move smoothly
   - ✅ No crashes or freezes
   - ✅ Routes update properly
   - ✅ No console errors

---

## 🔍 What to Look For

### ✅ Success Indicators
- Quick access buttons work instantly
- Dashboard loads with fuel prices
- Routes load with ETAs and cities
- No "Failed to fetch" errors
- Simulation runs smoothly
- All drivers visible on map

### ❌ Failure Indicators
- Quick access buttons don't work
- Stuck on "Fetching live..." for fuel
- "Failed to fetch" errors in console
- Routes don't load
- Drivers not visible
- Simulation crashes

---

## 🐛 If You See Errors

### "Failed to fetch" Errors
**What it means**: Network request failed after all retries

**Check**:
1. Is iPad connected to internet?
2. Check console for specific URL that failed
3. Look for retry attempts in logs (should see 10 attempts)
4. Check if fallback data is being used

**Expected behavior**: Should retry 10 times, then use fallback (no crash)

### Fuel Price Stuck
**What it means**: Fuel API not responding

**Check**:
1. Look for fuel API logs in console
2. Should see retry attempts (up to 7)
3. Should fall back to state-specific or national average

**Expected behavior**: Shows fallback price immediately if API fails

### Routes Not Loading
**What it means**: ORS routing API failing

**Check**:
1. Look for routing logs in console
2. Should see retry attempts (up to 6)
3. Should fall back to straight-line route

**Expected behavior**: Shows straight-line route if API fails (no crash)

---

## 📊 Console Logs to Monitor

### Good Logs (Success)
```
✅ Using configured API base URL: https://...
🔑 [tRPC] Fresh auth token obtained
✅ [tRPC] Response received: 200 OK
⛽ [Fuel API] Data received successfully
[getRouteProcedure] Route calculated successfully
```

### Warning Logs (Retrying)
```
⚠️ [tRPC] Fetch error (attempt 3/10): Failed to fetch
⏳ [tRPC] Waiting 4000ms before retry...
⚠️ Fuel API error (attempt 2): 503 Service Unavailable
⏳ [Fuel API] Retrying after 3000ms...
```

### Fallback Logs (Using Defaults)
```
⚠️ [Fuel API] No data returned from API
🔄 [Fuel API] Using state fallback for Illinois
[getRouteProcedure] Using fallback straight-line route
```

---

## 🎯 Test Checklist

### Quick Access
- [ ] Driver button signs in successfully
- [ ] Shipper button signs in successfully
- [ ] No errors during sign-in
- [ ] Dashboard loads after sign-in

### Driver Dashboard
- [ ] Fuel price displays (not stuck)
- [ ] GPS coordinates hidden
- [ ] No tRPC errors
- [ ] Data syncs to Command Center

### Command Center
- [ ] All drivers visible
- [ ] Lights blinking
- [ ] Routes load with ETAs
- [ ] Cities match driver locations
- [ ] No fetch errors

### Simulation
- [ ] Starts without errors
- [ ] Drivers move smoothly
- [ ] Routes update properly
- [ ] No crashes

### Error Handling
- [ ] Retries happen automatically
- [ ] Fallbacks work correctly
- [ ] No app crashes
- [ ] User sees data (even if fallback)

---

## 🚀 Quick Start Commands

### Test on iPad
1. Open Expo Go on iPad
2. Scan QR code from terminal
3. Tap "Driver" quick access button
4. Verify dashboard loads

### Test on Web Preview
1. Open web preview in browser
2. Tap "Driver" quick access button
3. Open browser console (F12)
4. Watch for logs and errors

---

## 📝 Notes

- **Passwords**: All test accounts use `loadrush123`
- **Accounts**: `driver@loadrush.co`, `shipper@loadrush.co`
- **Retries**: Up to 10 attempts with exponential backoff
- **Timeouts**: 90s for tRPC, 60s for routing, 30s for fuel
- **Fallbacks**: Always available, no crashes

---

## 🆘 Support

If issues persist after testing:
1. Check console logs for specific errors
2. Verify internet connection on iPad
3. Try web preview to compare behavior
4. Check if backend is running (should be automatic)
5. Restart app and try again

All fetch errors should now be handled gracefully with retries and fallbacks!
