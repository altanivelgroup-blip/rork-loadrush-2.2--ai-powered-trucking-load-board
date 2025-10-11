# Command Center Driver Fix

## Problem
Command Center is only showing 1 driver instead of 15 drivers across the platform.

## Root Cause
The Command Center pulls data from the `drivers` Firestore collection, which is separate from the `loads` collection. The drivers collection may not have been properly seeded or data was lost.

## Solution
Run the verification and reseed script to restore all 15 drivers to the Command Center.

## How to Fix

### Option 1: Run the Shell Script (Recommended)
```bash
chmod +x scripts/run-verify-reseed.sh
./scripts/run-verify-reseed.sh
```

### Option 2: Run Directly with Bun
```bash
bun run scripts/verify-and-reseed-command-center.ts
```

## What This Does

1. **Verifies** current driver count in Firestore
2. **Clears** any existing drivers (if count is wrong)
3. **Seeds** all 15 drivers with proper data:
   - 3 drivers at pickup (🟢)
   - 7 drivers in transit (🟡)
   - 4 drivers accomplished (🟣)
   - 1 driver with breakdown (🔴)

## Expected Result

After running the script, you should see:
- **Command Center**: 15 drivers visible on map
- **Admin Loads**: 5 loads (separate from drivers)
- **Driver Dashboard**: Loads assigned to specific drivers
- **Shipper Dashboard**: Posted loads

## Data Structure

### Drivers Collection (`drivers`)
- Used by: Command Center
- Contains: Driver GPS tracking, status, current load
- Count: 15 drivers

### Loads Collection (`loads`)
- Used by: Admin Loads, Shipper Dashboard, Driver Dashboard
- Contains: Load details, pickup/dropoff, rates
- Count: 5+ loads

## Verification

After running the script:

1. **Sign in as Admin**
   - Long-press the logo on auth screen
   - Enter admin credentials

2. **Go to Command Center**
   - Tap "Command" tab at bottom
   - Should see 15 drivers on map

3. **Filter by Status**
   - Tap "All" to see all 15 drivers
   - Tap "In Transit" to see 7 drivers
   - Tap "Pickup" to see 3 drivers
   - Tap "Accomplished" to see 4 drivers
   - Tap "Breakdown" to see 1 driver

## Notes

- The Command Center and Admin Loads are **separate systems**
- Command Center = Driver GPS tracking (15 drivers)
- Admin Loads = Load management (5 loads)
- Some drivers have loads assigned (LR-013 through LR-027)
- This is normal and expected behavior

## If Still Not Working

1. Check Firebase console for `drivers` collection
2. Verify Firestore rules allow read/write
3. Check browser console for errors
4. Ensure Firebase config is correct in `.env`
