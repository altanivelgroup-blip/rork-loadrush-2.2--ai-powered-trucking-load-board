# 🎯 START HERE: LoadRush Testing Setup

## ⚡ One-Command Setup

```bash
chmod +x scripts/setup-loadrush-testing.sh
./scripts/setup-loadrush-testing.sh
```

**This single command will:**
1. ✅ Seed 25 drivers with accurate city labels
2. ✅ Seed 23 loads with 30-day persistence  
3. ✅ Verify everything is working
4. ✅ Show you next steps

**Expected time:** ~30 seconds

---

## 📱 After Setup: Test on Your Device

### iPad/Mobile
```bash
# Start the app
bun start

# Scan QR code with Expo Go
# Sign in as: admin@loadrush.com
# Navigate to: Command Center
```

### Web Browser
```bash
# Open: http://localhost:8081
# Sign in as: admin@loadrush.com
# Navigate to: Command Center
```

---

## ✅ What to Verify

### In Command Center:
1. **See 25 blinking pins** on the map
2. **Toggle "View: Dark" → "View: Map"**
3. **Tap any pin** → popup shows city/state
4. **Verify city matches pin position**
   - Example: Pin over Houston shows "Houston, TX"
5. **Check sidebar** shows all 25 drivers

### Test Projector Mode (Optional):
1. Enable **"Projector Mode"** toggle
2. Watch driver details cycle every 15 seconds
3. All pins keep blinking
4. Disable to return to normal

---

## 📚 Documentation

### Quick Reference
- **QUICK_START_TESTING.md** - 5-minute fast track
- **LOADRUSH_TESTING_GUIDE.md** - Comprehensive guide
- **IMPLEMENTATION_SUMMARY.md** - Technical details

### Scripts Available
```bash
# Seed drivers only
./scripts/run-seed-command-center-v4.sh

# Seed loads only
./scripts/run-seed-loadrush.sh

# Verify setup
./scripts/run-verify-loadrush.sh

# Complete setup (all-in-one)
./scripts/setup-loadrush-testing.sh
```

---

## 🎯 What You're Testing

### ✅ Enhanced Features
- **25 test drivers** with accurate USA city/state labels
- **Real highway assignments**: I-45, I-10, I-95, I-80, etc.
- **Coordinates match cities**: Houston pin is over Houston
- **All pins blink**: Different colors for different statuses

### ✅ Persistent Data
- **23 test loads** with 30-day expiration
- **USA-only routes**: CA, TX, AZ, NM
- **Varied statuses**: Available, In-Transit, Completed

### ✅ Visual Accuracy
- **City labels match pin positions** on map
- **Works on iPad, web, and mobile**
- **No breaking changes** to existing features

---

## 🐛 Quick Troubleshooting

### Setup Failed?
```bash
# Check Firebase credentials
cat .env | grep FIREBASE

# Re-run setup
./scripts/setup-loadrush-testing.sh
```

### No Drivers Visible?
```bash
# Re-seed drivers
./scripts/run-seed-command-center-v4.sh
```

### City Labels Wrong?
```bash
# Verify you're using v4 data
./scripts/run-verify-loadrush.sh
```

---

## 🎉 Success Criteria

**You're ready when:**
- ✅ Setup script completes without errors
- ✅ Verification shows all checks passed
- ✅ 25 pins visible and blinking
- ✅ City labels match pin positions
- ✅ Can toggle between views
- ✅ No console errors

---

## 📞 Need Help?

1. **Run verification**: `./scripts/run-verify-loadrush.sh`
2. **Check guides**: See documentation files above
3. **Console logs**: Check browser/terminal for errors
4. **Re-run setup**: `./scripts/setup-loadrush-testing.sh`

---

## 🚀 Ready to Test!

Your LoadRush Command Center is now configured with:
- ✅ Accurate city labels matching map positions
- ✅ 30-day persistent loads (USA-only)
- ✅ Optional demo simulation framework
- ✅ All drivers visible with blinking pins
- ✅ Cross-platform compatibility

**Run the setup script and start testing! 🎯**

```bash
./scripts/setup-loadrush-testing.sh
```
