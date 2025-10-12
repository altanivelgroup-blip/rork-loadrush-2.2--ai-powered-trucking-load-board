# 🚀 QUICK FIX - Test on iPad NOW

## ⚡ 3 Steps to Fix & Test

### **STEP 1: Update .env File** (CRITICAL!)

```bash
# Find your IP address:
# Mac: ifconfig | grep "inet " | grep -v 127.0.0.1
# Windows: ipconfig

# Then edit .env and change this line:
EXPO_PUBLIC_RORK_API_BASE_URL=http://YOUR_IP_HERE:8081

# Example:
EXPO_PUBLIC_RORK_API_BASE_URL=http://192.168.1.100:8081
```

### **STEP 2: Restart Everything**

```bash
# Stop current server (Ctrl+C)

# Start backend (in one terminal)
bun run backend

# Start frontend (in another terminal)
bun start
```

### **STEP 3: Test on iPad**

1. Scan QR code with iPad
2. Sign in: `driver@loadrush.com`
3. Check dashboard loads
4. Verify fuel prices show (not stuck on "Fetching...")

---

## ✅ What Should Work Now

- ✅ Sign-in on iPad (no auth errors)
- ✅ tRPC calls work (no "Failed to fetch")
- ✅ Fuel prices load (live data or fallback)
- ✅ All drivers visible on Command Center
- ✅ Routes load without errors

---

## 🐛 If Still Broken

### **Auth Fails:**
- Go to Firebase Console → Authentication → Enable Email/Password

### **tRPC Fails:**
- Check `.env` has YOUR IP (not localhost)
- Restart server after changing `.env`
- iPad and computer on same WiFi

### **Fuel Stuck:**
- Check console logs for errors
- Verify backend is running on port 8081
- Check `FUEL_API_KEY` in `.env`

---

## 📊 Success Looks Like This

**Console should show:**
```
✅ Using configured API base URL: http://192.168.1.100:8081
🔐 [signIn] Firebase auth successful!
✅ [tRPC] Response received: 200 OK
✅ [Fuel API] Response ready in 1234ms (source: live_api)
```

**iPad should show:**
- Driver dashboard loads
- Fuel price: $3.99 (or similar)
- No error messages
- All features working

---

## 🎯 Full Details

See `IPAD_TESTING_GUIDE.md` for complete testing instructions.
