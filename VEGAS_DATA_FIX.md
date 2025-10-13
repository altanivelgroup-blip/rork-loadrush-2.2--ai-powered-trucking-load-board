# 🎰 Vegas Data Visibility Fix

## Problem
Vegas CSV data exists but wasn't visible in the app because:
1. ❌ Data not seeded to Firestore
2. ❌ Loads missing driver assignments (`matchedDriverId`)
3. ❌ Drivers missing proper location format for maps

## Solution Applied

### 1. Enhanced Seeding Script
Updated `scripts/seed-from-csv.ts` to:
- ✅ Add `driverId`, `name`, and dual location format (`lat/lng` + `latitude/longitude`)
- ✅ Auto-assign loads with `matchedDriverId` to `matched` status
- ✅ Add `expiresAt` field (7 days from now) for load filtering
- ✅ Enhanced logging for debugging

### 2. Updated CSV Data
Modified load CSVs to assign drivers:
- **Local Loads** (`loads-lv-local.csv`):
  - `LR-LVLV-2001` → `DRV-LV-001` (Alex Martinez)
  - `LR-LVLV-2002` → `DRV-LV-002` (Brianna Chen)
  - `LR-LVLV-2003` → `DRV-LV-003` (David Nguyen)
  
- **LA Loads** (`loads-lv-to-la.csv`):
  - `LR-LVLA-1001` → `DRV-LV-004` (Elena Gonzalez)
  - `LR-LVLA-1002` → `DRV-LV-005` (Marcus Johnson)

### 3. Data Structure
**Drivers** now include:
```typescript
{
  id: "DRV-LV-001",
  driverId: "DRV-LV-001",
  name: "Alex Martinez",
  location: {
    lat: 36.1009,
    lng: -115.2956,
    latitude: 36.1009,
    longitude: -115.2956,
    city: "Las Vegas",
    state: "NV"
  },
  // ... other fields
}
```

**Loads** now include:
```typescript
{
  id: "LR-LVLV-2001",
  matchedDriverId: "DRV-LV-001",
  matchedDriverName: "Alex Martinez",
  status: "matched",
  expiresAt: "2025-10-20T...",
  // ... other fields
}
```

## 🚀 Run the Fix

```bash
# Seed Vegas data to Firestore
./scripts/run-seed-from-csv.sh

# Or manually:
bunx tsx scripts/seed-from-csv.ts
```

## ✅ Verification Steps

### 1. Check Firestore Console
- **Drivers collection**: Should have 5+ Vegas drivers (DRV-LV-001 to DRV-LV-005)
- **Loads collection**: Should have 15+ Vegas loads (LR-LVLV-*, LR-LVLA-*, LR-LVSOCAL-*)
- **Shippers collection**: Should have 5 Vegas shippers (SHP-LV-001 to SHP-LV-005)

### 2. Test Driver View
```bash
# Log in as driver
Email: alex.martinez@example.com
Password: [create account or use existing]
```

**Expected Results**:
- ✅ Dashboard shows matched load `LR-LVLV-2001`
- ✅ Loads screen shows load with "Matched" status
- ✅ Can navigate to load details
- ✅ Can accept/start navigation

### 3. Test Admin Command Center
```bash
# Log in as admin
Email: admin@loadrush.com
```

**Expected Results**:
- ✅ Map shows 5 driver dots in Las Vegas area
- ✅ Sidebar lists all 5 drivers with names
- ✅ Click driver → shows details panel
- ✅ Click map pin → shows popup with location

### 4. Test Queries
Check browser console for logs:
```
[Driver Loads] Matched loads snapshot merged: 1
[useCommandCenterDrivers] Found 5 real drivers
✅ Driver DRV-LV-001: Alex Martinez at (36.1009, -115.2956)
```

## 🔍 Debugging

### No Loads Showing for Driver?
```typescript
// Check useDriverLoads hook logs:
[Driver Loads] Matched loads snapshot merged (filtered by expiresAt>=now): X
```

**Fix**: Ensure `expiresAt` is in the future (seeding script sets it to +7 days)

### No Drivers in Command Center?
```typescript
// Check useCommandCenterDrivers logs:
[useCommandCenterDrivers] Found X real drivers
```

**Fix**: Verify Firestore `drivers` collection has documents with proper `location.lat/lng`

### Loads Not Visible?
Check `matchedDriverId` field:
```bash
# In Firestore Console, check load document:
matchedDriverId: "DRV-LV-001"  # ✅ Good
matchedDriverId: ""            # ❌ Won't show for driver
```

## 📊 Data Summary

After seeding, you'll have:
- **5 Drivers** in Las Vegas with GPS coordinates
- **5 Shippers** (Walmart, Costco, Sam's Club, Airport, Dick's)
- **10 Local Loads** (LV to LV)
- **5 LA Loads** (LV to LA)
- **10 SoCal Loads** (LV to various SoCal cities)

**Total**: 25 loads, 5 matched to drivers for immediate testing

## 🎯 Testing Scenarios

### Scenario 1: Driver Accepts Load
1. Log in as `alex.martinez@example.com`
2. See matched load `LR-LVLV-2001` on dashboard
3. Navigate to Loads screen
4. Click load → Load Details
5. Accept load → Start navigation

### Scenario 2: Admin Monitors Fleet
1. Log in as admin
2. Open Command Center
3. See 5 drivers on map (Las Vegas area)
4. Click driver pin → See popup with details
5. Filter by status (e.g., "In Transit")

### Scenario 3: Backhaul Opportunity
1. Driver completes `LR-LVLV-2001` (local)
2. System suggests `LR-LVLA-1001` (to LA) as backhaul
3. Driver accepts → Starts long-haul route

## 🛠️ Troubleshooting

### Issue: "No loads found for driver"
**Cause**: `matchedDriverId` doesn't match user's driver ID
**Fix**: Check AuthContext resolves correct driver ID from email

### Issue: "No drivers in Command Center"
**Cause**: Missing `location.lat/lng` fields
**Fix**: Re-run seeding script (now includes dual format)

### Issue: "Loads expired"
**Cause**: `expiresAt` is in the past
**Fix**: Re-run seeding script (sets `expiresAt` to +7 days)

## 📝 Notes

- **Isolation**: Driver queries filter by `matchedDriverId` or `assignedDriverId`
- **Admin View**: Command Center shows ALL drivers (no filtering)
- **Real-time**: All data uses Firestore real-time listeners
- **Expiration**: Loads auto-filter by `expiresAt >= now()`

## 🎉 Success Criteria

✅ Drivers see their matched loads
✅ Admin sees all drivers on map
✅ Loads show correct cities (Las Vegas, LA, etc.)
✅ Navigation works with proper coordinates
✅ Real-time updates reflect in UI

---

**Last Updated**: 2025-10-13
**Status**: ✅ Ready to Test
