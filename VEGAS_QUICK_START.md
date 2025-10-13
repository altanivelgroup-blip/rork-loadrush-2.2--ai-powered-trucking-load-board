# 🎰 Vegas Data - QUICK START

## 1️⃣ Seed Data (30 seconds)

```bash
./scripts/run-seed-from-csv.sh
```

## 2️⃣ Verify (10 seconds)

```bash
./scripts/run-verify-vegas.sh
```

## 3️⃣ Test Driver View

```
Email: alex.martinez@example.com
Password: [create account]
```

**Expected**: 1 matched load on dashboard

## 4️⃣ Test Admin View

```
Email: admin@loadrush.com
```

**Expected**: 5 drivers on Command Center map

---

## 🐛 Troubleshooting

### No loads for driver?
```bash
# Check Firestore Console
# Load should have: matchedDriverId: "DRV-LV-001"
```

### No drivers in Command Center?
```bash
# Check Firestore Console
# Driver should have: location: { lat: 36.1009, lng: -115.2956 }
```

### Still broken?
```bash
# Re-run seeding
./scripts/run-seed-from-csv.sh

# Check browser console for errors
```

---

## 📊 What You Get

- **5 Drivers** in Las Vegas with GPS
- **5 Shippers** (Walmart, Costco, etc.)
- **25 Loads** (10 local, 5 LA, 10 SoCal)
- **5 Matched Loads** for immediate testing

---

## 📚 Full Docs

- **Quick Fix**: `RUN_THIS_VEGAS_FIX.md`
- **Technical**: `VEGAS_DATA_FIX.md`
- **Summary**: `VEGAS_FIX_COMPLETE.md`

---

**Status**: 🟢 Ready
**Time**: ~1 minute total
