# ✅ Verify tRPC Fix - Run These Commands Now

## 🔍 Step-by-Step Verification

### Step 1: Check Backend Status
Open terminal and run:
```bash
curl http://localhost:8081/api
```

**Expected Output:**
```json
{"status":"ok","message":"API is running"}
```

**If you get an error:**
```bash
# Start the backend
cd /path/to/your/project
npm run dev
# or
bun run dev
```

---

### Step 2: Test tRPC Endpoint Directly
In browser console (F12), paste this:
```javascript
fetch('http://localhost:8081/api/trpc/routing.getRoute?batch=1&input=%7B%220%22%3A%7B%22json%22%3A%7B%22origin%22%3A%7B%22latitude%22%3A32.7767%2C%22longitude%22%3A-96.797%7D%2C%22destination%22%3A%7B%22latitude%22%3A29.7604%2C%22longitude%22%3A-95.3698%7D%7D%7D%7D')
  .then(r => r.json())
  .then(data => {
    console.log('✅ tRPC Response:', data);
    if (data[0]?.result?.data?.json?.routeCoords) {
      console.log('✅ Route has', data[0].result.data.json.routeCoords.length, 'points');
      console.log('✅ Distance:', data[0].result.data.json.distanceMiles.toFixed(1), 'miles');
    }
  })
  .catch(err => console.error('❌ Error:', err));
```

**Expected Output:**
```
✅ tRPC Response: [{ result: { data: { json: { routeCoords: [...], distanceMiles: 239.4, ... } } } }]
✅ Route has 245 points
✅ Distance: 239.4 miles
```

---

### Step 3: Test Auth Token Integration
After signing in, run this in console:
```javascript
// Check if Firebase auth is working
firebase.auth().currentUser?.getIdToken().then(token => {
  console.log('✅ Auth token exists:', token ? 'YES' : 'NO');
  console.log('Token length:', token?.length);
});
```

**Expected Output:**
```
✅ Auth token exists: YES
Token length: 1234 (some number)
```

---

### Step 4: Test Retry Logic
1. Open Command Center
2. Open browser console (F12)
3. Stop the backend server
4. Refresh the page
5. Watch console for retry attempts:

**Expected Output:**
```
⚠️ tRPC fetch error (attempt 1/3): Failed to fetch
⚠️ tRPC fetch error (attempt 2/3): Failed to fetch
⚠️ tRPC fetch error (attempt 3/3): Failed to fetch
❌ tRPC fetch failed after retries: Failed to fetch
```

6. Restart backend
7. Refresh page again
8. Should work now:

**Expected Output:**
```
✅ [getRouteProcedure] Route calculated successfully
✅ [useDriverRoute] Route fetched successfully
```

---

### Step 5: Verify Command Center
1. Sign in as admin: `admin@loadrush.com`
2. Navigate to Command Center
3. Check console for these logs:

**Expected Logs:**
```
🔐 [signIn] Sign in successful as: admin
✅ [onAuthStateChanged] Setting user with role: admin
[Map] Ready
[Map] Auto-fitting to USA region on web
[getRouteProcedure] Request received: { origin: "32.7767, -96.7970", destination: "29.7604, -95.3698", hasAuth: true }
[getRouteProcedure] Calling ORS API (attempt 1/3)...
[getRouteProcedure] Route calculated successfully: { points: 245, distance: "239.4 mi", duration: "3 h 42 m" }
[useDriverRoute] Route fetched successfully { points: 245, distance: "239.4 mi", duration: "3 h 42 m" }
```

---

### Step 6: Visual Verification
In Command Center, verify:
- [ ] All drivers visible on map (should see multiple colored dots)
- [ ] Lights blinking/pulsing on driver markers
- [ ] Driver cards show ETA and distance
- [ ] No error messages on screen
- [ ] Projector mode toggle works
- [ ] Filter buttons work (All, Pickup, In Transit, etc.)

---

## 🐛 Troubleshooting Commands

### Check Environment Variables
```bash
# In terminal
cat .env | grep -E "RORK_API_BASE_URL|ORS_API_KEY"
```

**Expected Output:**
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
EXPO_PUBLIC_ORS_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE5ZWQ2NGVmNDA5MjQ3M2E4ZWRhMGIwODJiN2Q5N2M0IiwiaCI6Im11cm11cjY0In0=
```

### Test ORS API Key
```bash
curl -X POST 'https://api.openrouteservice.org/v2/directions/driving-car' \
  -H 'Authorization: eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE5ZWQ2NGVmNDA5MjQ3M2E4ZWRhMGIwODJiN2Q5N2M0IiwiaCI6Im11cm11cjY0In0=' \
  -H 'Content-Type: application/json' \
  -d '{"coordinates":[[-96.797,32.7767],[-95.3698,29.7604]]}'
```

**Expected:** JSON response with route data

### Check Firestore Drivers
In browser console:
```javascript
// Check if drivers exist in Firestore
firebase.firestore().collection('drivers').limit(5).get()
  .then(snap => {
    console.log('✅ Found', snap.size, 'drivers');
    snap.forEach(doc => console.log('Driver:', doc.id, doc.data().name));
  });
```

---

## 📊 Success Indicators

### Console Logs (Good)
```
✅ [signIn] Sign in successful
✅ [getRouteProcedure] Route calculated successfully
✅ [useDriverRoute] Route fetched successfully
✅ Firebase Auth token exists: YES
```

### Console Logs (Bad)
```
❌ tRPC fetch failed after retries
❌ Failed to fetch
❌ TRPCClientError
❌ Network error
```

---

## 🎯 Quick Test Script

Copy and paste this entire block into browser console after signing in:

```javascript
(async function testTRPC() {
  console.log('🧪 Starting tRPC Fix Verification...\n');
  
  // Test 1: Backend
  try {
    const backend = await fetch('http://localhost:8081/api').then(r => r.json());
    console.log('✅ Test 1: Backend is running:', backend.message);
  } catch (e) {
    console.error('❌ Test 1: Backend not accessible:', e.message);
    return;
  }
  
  // Test 2: Auth Token
  try {
    const user = firebase.auth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      console.log('✅ Test 2: Auth token exists (length:', token.length, ')');
    } else {
      console.warn('⚠️ Test 2: No user signed in');
    }
  } catch (e) {
    console.error('❌ Test 2: Auth token error:', e.message);
  }
  
  // Test 3: Firestore Drivers
  try {
    const snap = await firebase.firestore().collection('drivers').limit(3).get();
    console.log('✅ Test 3: Found', snap.size, 'drivers in Firestore');
  } catch (e) {
    console.error('❌ Test 3: Firestore error:', e.message);
  }
  
  console.log('\n🎉 Verification complete! Check results above.');
})();
```

---

## ✅ Final Checklist

Run through this checklist:

1. **Backend Running**
   ```bash
   curl http://localhost:8081/api
   ```
   - [ ] Returns `{"status":"ok"}`

2. **Sign In Works**
   - [ ] No errors in console
   - [ ] Redirects to dashboard

3. **Command Center Loads**
   - [ ] Drivers visible on map
   - [ ] No fetch errors
   - [ ] Route data loads

4. **Retry Logic Works**
   - [ ] Stop backend → see retry attempts
   - [ ] Start backend → works again

5. **Auth Tokens Included**
   - [ ] Console shows `hasAuth: true`
   - [ ] No auth warnings

---

## 🚀 You're Done When...

- ✅ All console logs show success (✅)
- ✅ No fetch errors after sign-in
- ✅ Routes load in Command Center
- ✅ Drivers visible and animated
- ✅ Retry logic works when tested

**If all checks pass:** Your tRPC fix is working perfectly! 🎉

**If any fail:** Check the specific error message and refer to TRPC_FIX_VERIFICATION.md for detailed troubleshooting.

---

**Last Updated:** 2025-10-12
**Status:** Ready for Testing
