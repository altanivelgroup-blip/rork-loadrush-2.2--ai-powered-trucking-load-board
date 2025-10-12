# 🚀 LoadRush Quick Start Testing Guide

## ⚡ Fast Track (5 Minutes)

### Step 1: Seed Data
```bash
# Seed 25 drivers with accurate city labels
chmod +x scripts/run-seed-command-center-v4.sh
./scripts/run-seed-command-center-v4.sh

# Seed 23 loads with 30-day persistence
chmod +x scripts/run-seed-loadrush.sh
./scripts/run-seed-loadrush.sh
```

### Step 2: Verify Setup
```bash
# Run verification script
chmod +x scripts/run-verify-loadrush.sh
./scripts/run-verify-loadrush.sh
```

**Expected Output:**
```
✅ Found 25 drivers with complete enhanced data
✅ Found 23 loads
✅ All drivers have accurate city coordinates
🎉 ALL CHECKS PASSED!
```

### Step 3: Test on Device

#### iPad/Mobile
1. Start app: `bun start`
2. Scan QR code with Expo Go
3. Sign in as **admin**
4. Navigate to **Command Center**

#### Web
1. Open `http://localhost:8081`
2. Sign in as **admin**
3. Navigate to **Command Center**

### Step 4: Visual Verification Checklist

**In Command Center:**
- [ ] See 25 blinking pins on map
- [ ] Toggle "View: Dark" → "View: Map"
- [ ] Tap any pin → popup shows city/state
- [ ] Verify city label matches pin position
  - Example: Pin over Houston shows "Houston, TX"
- [ ] All drivers visible in sidebar (25 total)

**Test Projector Mode (Optional):**
- [ ] Enable "Projector Mode" toggle
- [ ] Watch driver details cycle every 15 seconds
- [ ] All pins keep blinking
- [ ] Disable to return to normal mode

---

## 🎯 What You're Testing

### ✅ Enhanced Driver Data
- **25 test drivers** with accurate USA city/state labels
- **Real highway assignments**: I-45, I-10, I-95, I-80, etc.
- **Coordinates match cities**: Houston pin is actually over Houston
- **All pins blink**: Green (pickup), Orange (in transit), Purple (accomplished), Red (breakdown)

### ✅ Persistent Loads
- **23 test loads** with varied statuses
- **30-day expiration**: Loads persist for a month
- **USA-only routes**: CA, TX, AZ, NM
- **12 Available** (visible to drivers)
- **7 In-Transit/Assigned** (tracked by shipper)
- **4 Completed** (delivery history)

### ✅ Demo Simulation (Optional)
- **5-minute simulation**: Drivers move along fake routes
- **Live pin updates**: Watch pins move on highways
- **Auto-reset**: Simulation loops automatically
- **Projector mode**: Cycles through driver details

---

## 🐛 Quick Troubleshooting

### No Drivers Visible?
```bash
./scripts/run-seed-command-center-v4.sh
```

### No Loads Visible?
```bash
./scripts/run-seed-loadrush.sh
```

### City Labels Wrong?
- Check you're using **v4 enhanced data**
- Re-run: `./scripts/run-seed-command-center-v4.sh`

### Map Won't Load?
- Check internet connection
- Try web version first
- Verify Firebase credentials in `.env`

---

## 📊 Success Criteria

**You're ready when:**
- ✅ Verification script shows all checks passed
- ✅ 25 pins visible and blinking on map
- ✅ City labels match pin positions
- ✅ Can toggle between Dark/Map views
- ✅ Popups show correct city/state
- ✅ No console errors

---

## 📖 Need More Details?

See **LOADRUSH_TESTING_GUIDE.md** for:
- Detailed step-by-step instructions
- Platform-specific testing (iPad, web, Android)
- Demo simulation setup
- Comprehensive troubleshooting
- Test results template

---

## 🎉 That's It!

Your LoadRush Command Center is now ready for testing with:
- ✅ Accurate city labels matching map positions
- ✅ 30-day persistent loads (USA-only)
- ✅ Optional demo simulation
- ✅ All drivers visible with blinking pins
- ✅ Works on iPad, web, and mobile

**Happy Testing! 🚀**
