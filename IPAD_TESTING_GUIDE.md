# iPad Testing Guide - LoadRush Authentication & tRPC Fixes

## 🎯 What Was Fixed

### 1. **Firebase Authentication Issues**
- ✅ Added better error handling for blocked sign-in methods
- ✅ Enhanced logging to track auth flow on iPad
- ✅ Added network error detection and user-friendly messages
- ✅ Fixed invalid-credential error handling

### 2. **tRPC Fetch Errors**
- ✅ Increased retry attempts from 3 to 5
- ✅ Extended retry delay from 1s to 2s (progressive backoff)
- ✅ Increased timeout from 30s to 45s
- ✅ Added comprehensive logging for debugging
- ✅ Better error detection for network issues

### 3. **Fuel Price Loading**
- ✅ Enhanced retry logic (5 attempts with 3s delays)
- ✅ Added detailed logging for debugging
- ✅ Better fallback handling with data source tracking
- ✅ Improved error states in UI

---

## 🚨 CRITICAL: Before Testing on iPad

### **Step 1: Update API Base URL**

The current `.env` file has:
```
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081
```

**This will NOT work on iPad!** You need to:

1. **Find your computer's local IP address:**
   - **Mac:** Open Terminal → `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows:** Open CMD → `ipconfig` → Look for IPv4 Address
   - Example: `192.168.1.100`

2. **Update `.env` file:**
   ```bash
   EXPO_PUBLIC_RORK_API_BASE_URL=http://192.168.1.100:8081
   ```
   ⚠️ Replace `192.168.1.100` with YOUR actual IP address

3. **Restart the development server:**
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart
   bun start
   ```

### **Step 2: Ensure Backend is Running**

Make sure your backend server is running and accessible:
```bash
# In a separate terminal
bun run backend
```

Verify it's working by visiting in your browser:
```
http://YOUR_IP_ADDRESS:8081/api/trpc
```

You should see a tRPC response (not an error page).

---

## 📱 Testing on iPad

### **Method 1: Scan QR Code**

1. Start the dev server: `bun start`
2. Scan the QR code with your iPad camera
3. Open in Expo Go app

### **Method 2: Manual URL Entry**

1. Open Expo Go on iPad
2. Enter: `exp://YOUR_IP_ADDRESS:8081`
3. Tap "Connect"

---

## ✅ Test Checklist

### **1. Sign-In Test (Driver)**

- [ ] Open app on iPad
- [ ] Enter email: `driver@loadrush.com`
- [ ] Enter password: (your password)
- [ ] Tap "Sign In"
- [ ] **Expected:** Should log in successfully and navigate to driver dashboard
- [ ] **Check console logs** for:
  - `🔐 [signIn] Starting sign in for: driver@loadrush.com`
  - `🔐 [signIn] Firebase auth successful!`
  - `✅ [signIn] Sign in successful as: driver`

**If it fails:**
- Check console for error code
- Verify Firebase Console → Authentication → Sign-in method → Email/Password is **ENABLED**
- Check network connectivity

---

### **2. Sign-In Test (Shipper)**

- [ ] Sign out if logged in
- [ ] Enter email: `shipper@loadrush.com`
- [ ] Enter password: (your password)
- [ ] Tap "Sign In"
- [ ] **Expected:** Should log in successfully and navigate to shipper dashboard

---

### **3. tRPC Connection Test**

After signing in as driver:

- [ ] Navigate to Driver Dashboard
- [ ] **Check console logs** for:
  - `✅ Using configured API base URL: http://YOUR_IP:8081`
  - `🔄 [tRPC] Fetch attempt 1/5 to: http://YOUR_IP:8081/api/trpc/...`
  - `✅ [tRPC] Response received: 200 OK`

**If you see fetch errors:**
- Verify `.env` has correct IP address
- Restart dev server after changing `.env`
- Check backend is running on port 8081
- Ensure iPad and computer are on same WiFi network

---

### **4. Fuel Price Test**

On Driver Dashboard:

- [ ] Scroll to "Current Fuel Price" card
- [ ] **Expected:** Should show live fuel price (not "Fetching live...")
- [ ] **Check console logs** for:
  - `⛽ [useFuelPrices] Hook called`
  - `✅ [Fuel API] Response ready in XXXms (source: live_api)`
  - `✅ [useFuelPrices] Data received`

**If stuck on "Fetching live...":**
- Check console for tRPC errors
- Verify backend fuel API route is working
- Check `FUEL_API_KEY` in `.env` is set

**If showing fallback price:**
- Look for warning banner: "Using estimated price"
- This is OK if API is unavailable, but should show actual data source

---

### **5. Command Center Test (Admin)**

- [ ] Sign in as admin (long-press logo on auth screen)
- [ ] Navigate to Command Center
- [ ] **Expected:** Should see drivers on map with blinking lights
- [ ] **Check console logs** for route fetching

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Failed to fetch" errors**

**Symptoms:**
- tRPC errors in console
- Fuel prices stuck loading
- Routes not loading

**Solution:**
1. Check `.env` has correct IP (not localhost)
2. Restart dev server after changing `.env`
3. Verify backend is running
4. Ensure same WiFi network

---

### **Issue 2: Firebase auth blocked**

**Symptoms:**
- Error: `auth/requests-to-this-api-identitytoolkit-method...are-blocked`

**Solution:**
1. Go to Firebase Console
2. Authentication → Sign-in method
3. Enable "Email/Password"
4. Save changes
5. Try signing in again

---

### **Issue 3: Network request failed**

**Symptoms:**
- Error: `auth/network-request-failed`

**Solution:**
1. Check iPad internet connection
2. Verify Firebase config in `config/firebase.ts`
3. Check firewall settings (allow port 8081)

---

### **Issue 4: Fuel prices showing fallback**

**Symptoms:**
- Yellow warning banner
- "Using estimated price"

**Solution:**
1. Check `FUEL_API_KEY` in `.env`
2. Verify backend fuel route is working
3. Check console for API errors
4. This is non-critical - app still works with fallback

---

## 📊 Expected Console Output (Success)

### **Sign-In:**
```
🔐 [signIn] Starting sign in for: driver@loadrush.com
🔐 [signIn] Platform: ios
🔐 [signIn] Calling Firebase signInWithEmailAndPassword...
🔐 [signIn] Firebase auth successful! UID: abc123...
🔐 [signIn] Resolving user role...
✅ [resolveUserRole] Email hint found - using as PRIMARY source: driver
✅ [signIn] Sign in successful as: driver
```

### **tRPC Connection:**
```
✅ Using configured API base URL: http://192.168.1.100:8081
🔄 [tRPC] Fetch attempt 1/5 to: http://192.168.1.100:8081/api/trpc/fuel.getPrices
🔑 [tRPC] Auth token attached
✅ [tRPC] Response received: 200 OK
```

### **Fuel Prices:**
```
⛽ [useFuelPrices] Hook called: { fuelType: 'diesel', state: 'Illinois', city: null, enabled: true }
⛽ [Fuel API] Request: fuelType=diesel, state=Illinois, city=none
✅ [Fuel API] Data received, parsing...
💰 [Fuel API] Diesel avg from 15 records: 3.99
✅ [Fuel API] Response ready in 1234ms (source: live_api)
✅ [useFuelPrices] Data received: { diesel: 3.99, ... }
```

---

## 🎯 Success Criteria

All of these should work on iPad:

- ✅ Sign in with driver@loadrush.com
- ✅ Sign in with shipper@loadrush.com
- ✅ Dashboard loads without errors
- ✅ Fuel prices show live data (or fallback with warning)
- ✅ No "Failed to fetch" errors in console
- ✅ Command Center shows drivers (admin)
- ✅ All drivers visible with blinking lights
- ✅ Routes load without errors

---

## 📝 Reporting Issues

If you encounter issues, provide:

1. **Console logs** (full output)
2. **Screenshot** of error
3. **Steps to reproduce**
4. **Platform:** iPad model, iOS version
5. **Network:** WiFi name, IP address
6. **Environment:** `.env` contents (hide API keys)

---

## 🚀 Next Steps After Successful Testing

Once everything works on iPad:

1. Test on iPhone (should work same way)
2. Test on Android device
3. Test on web browser (should work with localhost)
4. Consider deploying backend to production server
5. Update `.env` with production API URL

---

## 💡 Pro Tips

1. **Keep console open** - Most issues are visible in logs
2. **Test incrementally** - Sign in first, then test features
3. **Use same WiFi** - iPad and computer must be on same network
4. **Restart when needed** - After changing `.env`, always restart
5. **Check Firebase Console** - Verify auth settings are correct

---

## 📞 Support

If issues persist after following this guide:
1. Check all console logs
2. Verify network configuration
3. Test backend separately (Postman/browser)
4. Review Firebase Console settings
