# 🎰 VEGAS DATA - QUICK FIX

## Problem
Vegas CSV data exists but NOT visible in app (drivers/loads/shippers).

## Solution (1 Command)

```bash
./scripts/run-seed-from-csv.sh
```

**What it does**:
1. ✅ Seeds 5 Vegas drivers with GPS coords (36.1009, -115.2956, etc.)
2. ✅ Seeds 5 Vegas shippers (Walmart, Costco, Sam's Club, Airport, Dick's)
3. ✅ Seeds 25 Vegas loads (10 local, 5 to LA, 10 to SoCal)
4. ✅ Assigns 5 loads to drivers for immediate testing

## Expected Output

```
🚀 Starting Vegas Data Seeding...
============================================================

📦 Step 1: Seeding Drivers...
  ✅ Driver DRV-LV-001: Alex Martinez at (36.1009, -115.2956)
  ✅ Driver DRV-LV-002: Brianna Chen at (36.0840, -115.1537)
  ✅ Driver DRV-LV-003: David Nguyen at (36.2735, -115.2065)
  ✅ Driver DRV-LV-004: Elena Gonzalez at (36.0257, -115.1227)
  ✅ Driver DRV-LV-005: Marcus Johnson at (36.1273, -115.1718)
✅ Drivers seeded: 5

📦 Step 2: Seeding Shippers...
  ✅ Shipper SHP-LV-001: Walmart #2593
  ✅ Shipper SHP-LV-002: Costco Business Center
  ✅ Shipper SHP-LV-003: Sam's Club #6252
  ✅ Shipper SHP-LV-004: Harry Reid Int'l Airport
  ✅ Shipper SHP-LV-005: DICK'S Sporting Goods
✅ Shippers seeded: 5

📦 Step 3: Seeding Loads...
  ✅ Load LR-LVLV-2001 matched to driver DRV-LV-001
  ✅ Load LR-LVLV-2002 matched to driver DRV-LV-002
  ✅ Load LR-LVLV-2003 matched to driver DRV-LV-003
  ✅ Load LR-LVLA-1001 matched to driver DRV-LV-004
  ✅ Load LR-LVLA-1002 matched to driver DRV-LV-005
✅ Loads seeded: 25

============================================================
✅ Vegas Data Seeding Complete!
```

## Test It NOW

### 1. Driver View (Web/iPad/Android)
```
Email: alex.martinez@example.com
Password: [create account first]
```

**What you'll see**:
- ✅ Dashboard: 1 matched load (`LR-LVLV-2001`)
- ✅ Loads screen: Load with "Matched" badge
- ✅ Load details: Walmart pickup → Cheyenne Ave delivery
- ✅ Can accept/navigate

### 2. Admin Command Center
```
Email: admin@loadrush.com
```

**What you'll see**:
- ✅ Map: 5 driver dots in Las Vegas
- ✅ Sidebar: 5 drivers listed (Alex, Brianna, David, Elena, Marcus)
- ✅ Click pin → Popup with driver details
- ✅ Real-time tracking

## Verify in Firestore Console

1. Go to: https://console.firebase.google.com/project/loadrush-admin-console/firestore
2. Check collections:
   - **drivers**: 5 docs (DRV-LV-001 to DRV-LV-005)
   - **shippers**: 5 docs (SHP-LV-001 to SHP-LV-005)
   - **loads**: 25 docs (LR-LVLV-*, LR-LVLA-*, LR-LVSOCAL-*)

## Troubleshooting

### "No loads showing for driver"
**Check**: Browser console for `[Driver Loads]` logs
**Fix**: Ensure driver email matches CSV (e.g., `alex.martinez@example.com`)

### "No drivers in Command Center"
**Check**: Firestore `drivers` collection has `location.lat/lng`
**Fix**: Re-run seeding script

### "Permission denied"
**Check**: Firestore rules allow read/write
**Fix**: Update rules or use admin account

## What Changed

### Before
```typescript
// Loads had empty matchedDriverId
matchedDriverId: ""  // ❌ Not visible to drivers
```

### After
```typescript
// Loads now assigned to drivers
matchedDriverId: "DRV-LV-001"  // ✅ Visible to Alex Martinez
status: "matched"
expiresAt: "2025-10-20T..."
```

### Before
```typescript
// Drivers missing map-compatible location
location: {
  latitude: 36.1009,
  longitude: -115.2956
}
```

### After
```typescript
// Drivers have dual format for compatibility
location: {
  lat: 36.1009,        // ✅ For maps
  lng: -115.2956,      // ✅ For maps
  latitude: 36.1009,   // ✅ For queries
  longitude: -115.2956 // ✅ For queries
}
```

## Data Summary

**Drivers** (5):
- DRV-LV-001: Alex Martinez (36.1009, -115.2956)
- DRV-LV-002: Brianna Chen (36.0840, -115.1537)
- DRV-LV-003: David Nguyen (36.2735, -115.2065)
- DRV-LV-004: Elena Gonzalez (36.0257, -115.1227)
- DRV-LV-005: Marcus Johnson (36.1273, -115.1718)

**Matched Loads** (5):
- LR-LVLV-2001 → DRV-LV-001 (Local: Walmart → Cheyenne)
- LR-LVLV-2002 → DRV-LV-002 (Local: Costco → Riley St)
- LR-LVLV-2003 → DRV-LV-003 (Local: Sam's Club → Craig Rd)
- LR-LVLA-1001 → DRV-LV-004 (Long-haul: Walmart → Burbank, CA)
- LR-LVLA-1002 → DRV-LV-005 (Long-haul: Costco → LA, CA)

**Unmatched Loads** (20):
- Available for drivers to accept
- Mix of local (LV to LV) and long-haul (LV to CA)

## Next Steps

1. ✅ Run seeding script
2. ✅ Refresh app
3. ✅ Test driver login
4. ✅ Test admin Command Center
5. ✅ Test accept/navigate/backhaul flows

---

**Status**: 🟢 Ready to Run
**Time**: ~30 seconds
**Impact**: Full Vegas data visibility
