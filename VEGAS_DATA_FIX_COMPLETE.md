# Vegas Data Fix - Complete Solution

## Problem Identified

The Vegas CSV data wasn't visible in the app because of a **driver ID mismatch**:

1. **CSV Data**: Drivers have IDs like `DRV-LV-001`, and loads reference these IDs in `matchedDriverId`
2. **Firebase Auth**: When drivers log in, Firebase assigns them a UID like `abc123xyz`
3. **Query Mismatch**: The app was querying loads using the Firebase UID, but loads were stored with the CSV driver IDs

## Solution Implemented

### 1. Updated Auth Context (`contexts/AuthContext.tsx`)
- Changed from querying Firestore by document ID (Firebase UID) to querying by **email**
- Now looks up driver profile using `where('email', '==', email)` query
- Extracts the `driverId` from the Firestore document and stores it in the user profile
- This ensures the driver's actual ID (e.g., `DRV-LV-001`) is available in the app

### 2. Updated Driver Loads Hook (`hooks/useDriverLoads.ts`)
- Modified to use `user.profile.driverId` instead of `user.id` (Firebase UID)
- Now correctly queries loads where `matchedDriverId == DRV-LV-001` instead of `matchedDriverId == abc123xyz`

### 3. Updated Types (`types/index.ts`)
- Added optional `driverId?: string` field to `DriverProfile` interface

### 4. Created Seeding Script (`scripts/quick-seed-vegas.js`)
- Simple Node.js script that reads CSV files and writes to Firestore
- Handles drivers, shippers, and all load files (local, to-LA, to-SoCal)
- No permission issues (pure Node.js, no shell script complications)

## How to Seed the Data

Run this command in your terminal:

```bash
bash scripts/run-quick-seed-vegas.sh
```

Or directly with Node:

```bash
node scripts/quick-seed-vegas.js
```

This will:
1. ✅ Seed 10 Vegas drivers with GPS coordinates
2. ✅ Seed 5 Vegas shippers
3. ✅ Seed all loads from:
   - `loads-lv-local.csv` (local Vegas deliveries)
   - `loads-lv-to-la.csv` (Vegas to LA routes)
   - `loads-lv-to-socal.csv` (Vegas to Southern California routes)

## Testing the Fix

### For Drivers:

1. **Log in as a Vegas driver**:
   - Email: `alex.martinez@example.com`
   - Password: (create account or use existing)

2. **What you should see**:
   - Driver dashboard shows loads assigned to `DRV-LV-001`
   - Loads screen displays matched loads (e.g., `LR-LVLV-2001`)
   - Map screen shows pickup/dropoff locations in Vegas
   - Can accept loads and start navigation

3. **Test other drivers**:
   - `brianna.chen@example.com` → `DRV-LV-002`
   - `david.nguyen@example.com` → `DRV-LV-003`
   - `elena.gonzalez@example.com` → `DRV-LV-004`

### For Admin (Command Center):

1. **Log in as admin**:
   - Email: `admin@loadrush.com` (or use admin bypass)

2. **What you should see**:
   - Command Center shows all 10 Vegas drivers on the map
   - Each driver has GPS coordinates in Las Vegas area
   - Driver cards show status, current load, and location
   - Real-time updates as drivers move

3. **Verify data**:
   - Check that driver names match CSV data
   - Verify GPS coordinates are in Vegas (36.x, -115.x)
   - Confirm loads are visible and properly assigned

## Data Structure

### Drivers Collection
```
drivers/DRV-LV-001
  - id: "DRV-LV-001"
  - driverId: "DRV-LV-001"
  - name: "Alex Martinez"
  - email: "alex.martinez@example.com"
  - location: { lat: 36.1009, lng: -115.2956 }
  - status: "active"
  - truckInfo: { ... }
  - trailerInfo: { ... }
```

### Loads Collection
```
loads/LR-LVLV-2001
  - id: "LR-LVLV-2001"
  - shipperId: "SHP-LV-001"
  - shipperName: "Walmart #2593"
  - status: "matched"
  - matchedDriverId: "DRV-LV-001"  ← This now matches!
  - matchedDriverName: "Alex Martinez"
  - pickup: { city: "Las Vegas", ... }
  - dropoff: { city: "Las Vegas", ... }
```

## Key Changes Summary

| Component | Before | After |
|-----------|--------|-------|
| Auth lookup | By Firebase UID | By email address |
| Driver ID source | Firebase UID | Firestore `driverId` field |
| Load queries | `matchedDriverId == firebaseUID` | `matchedDriverId == driverId` |
| Profile data | Minimal | Full driver profile from CSV |

## Troubleshooting

### "No loads visible for driver"
- Check console logs for `[Driver Loads]` messages
- Verify the driver's email matches a CSV entry
- Confirm loads have `matchedDriverId` matching the driver's `driverId`

### "Command Center shows no drivers"
- Run the seeding script again
- Check Firestore console for `drivers` collection
- Verify drivers have `location` field with `lat` and `lng`

### "Permission denied" when running seed script
- Use the Node.js version: `node scripts/quick-seed-vegas.js`
- Make sure `.env` file has Firebase credentials
- Check Firebase rules allow writes to `drivers`, `shippers`, and `loads` collections

## Next Steps

1. ✅ Seed the data using the script
2. ✅ Test driver login and load visibility
3. ✅ Test admin Command Center view
4. ✅ Test navigation and load acceptance
5. ✅ Verify backhaul suggestions work with Vegas data

## Files Modified

- `contexts/AuthContext.tsx` - Email-based driver lookup
- `hooks/useDriverLoads.ts` - Use profile.driverId for queries
- `types/index.ts` - Added driverId to DriverProfile
- `scripts/quick-seed-vegas.js` - New seeding script
- `scripts/run-quick-seed-vegas.sh` - Shell wrapper for seeding

---

**Status**: ✅ Ready to test
**Last Updated**: 2025-10-13
