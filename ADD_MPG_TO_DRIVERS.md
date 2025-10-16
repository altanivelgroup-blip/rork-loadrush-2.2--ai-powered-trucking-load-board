# Add MPG to Driver Profiles - Complete Guide

## What This Does

This update adds realistic MPG (Miles Per Gallon) values to each test driver profile in Firestore. Once updated, the analytics dashboard will show **live data** based on each driver's actual MPG from their profile.

## Why This Matters

Currently, the driver analytics shows dummy/static MPG values. With this update:

1. ✅ **Each driver has their own realistic MPG** (ranging from 6.1 to 7.9 MPG - typical for semi-trucks)
2. ✅ **Dashboard shows live data** from driver profiles
3. ✅ **Analytics calculations use real values** (fuel costs, efficiency, etc.)
4. ✅ **No duplicate data entry** - MPG is part of the driver profile

## MPG Values Added

All 25 test drivers now have MPG values:

| Driver ID | Name | MPG | Status |
|-----------|------|-----|--------|
| DRV-030 | Noah Jenkins | 6.8 | Pickup |
| DRV-031 | Mia Carter | 7.2 | In Transit |
| DRV-032 | Ethan Price | 6.5 | Accomplished |
| DRV-033 | Harper Rivera | 7.1 | Breakdown |
| DRV-034 | Liam Torres | 6.9 | Pickup |
| DRV-035 | Olivia Brooks | 7.4 | In Transit |
| DRV-036 | Lucas Gray | 6.6 | Accomplished |
| DRV-037 | Ava Reed | 7.0 | Pickup |
| DRV-038 | Mason Kelly | 6.7 | In Transit |
| DRV-039 | Isabella Cox | 7.3 | Breakdown |
| DRV-040 | James Howard | 6.4 | Pickup |
| DRV-041 | Sophia Ward | 7.5 | In Transit |
| DRV-042 | Benjamin Torres | 6.3 | Accomplished |
| DRV-043 | Charlotte Peterson | 7.6 | Pickup |
| DRV-044 | Alexander Bailey | 6.2 | In Transit |
| DRV-045 | Amelia Cooper | 7.8 | Accomplished |
| DRV-046 | Daniel Richardson | 6.1 | Breakdown |
| DRV-047 | Evelyn Cox | 7.7 | Pickup |
| DRV-048 | Matthew Howard | 6.9 | In Transit |
| DRV-049 | Abigail Ward | 7.1 | Accomplished |
| DRV-050 | Joseph Torres | 6.5 | Pickup |
| DRV-051 | Emily Peterson | 7.9 | In Transit |
| DRV-052 | Michael Bailey | 6.8 | Accomplished |
| DRV-053 | Elizabeth Cooper | 7.4 | Breakdown |
| DRV-054 | David Richardson | 6.6 | Pickup |

**MPG Range:** 6.1 - 7.9 MPG  
**Average:** ~7.0 MPG (realistic for Class 8 semi-trucks)

## How to Run the Update

### Step 1: Make the script executable
```bash
chmod +x scripts/run-update-driver-mpg.sh
```

### Step 2: Run the update script
```bash
./scripts/run-update-driver-mpg.sh
```

## What Happens

1. Script reads all 25 driver profiles from the enhanced data
2. Updates each driver document in Firestore with their `avgMPG` value
3. Shows progress for each driver
4. Displays summary statistics

## Expected Output

```
🚀 Starting MPG update for all driver profiles...

✅ Updated Noah Jenkins (DRV-030): MPG = 6.8
✅ Updated Mia Carter (DRV-031): MPG = 7.2
✅ Updated Ethan Price (DRV-032): MPG = 6.5
...

============================================================
📊 MPG UPDATE SUMMARY
============================================================
✅ Successfully updated: 25
❌ Errors: 0
📈 Total drivers processed: 25

✨ MPG update complete!

📦 Total drivers in Firestore: 25
🎯 Drivers with MPG: 25
📊 MPG Stats: Min=6.1, Max=7.9, Avg=7.0
```

## Where MPG Shows Up

After running the update, MPG values will be displayed in:

### 1. Driver Dashboard
- **Performance Overview** section
- **Avg MPG** card shows the driver's actual MPG from their profile

### 2. Driver Analytics Page
- **Fuel & Efficiency** section
- Shows real-time MPG from driver profile
- Used in fuel cost calculations
- Used in estimated range calculations

### 3. Load Analytics
- When drivers view load details
- MPG is used to calculate:
  - Fuel needed for the trip
  - Estimated fuel cost
  - Net profit after fuel costs

## Database Structure

The MPG value is stored in the driver document:

```typescript
// Firestore: drivers/{driverId}
{
  driverId: "DRV-030",
  name: "Noah Jenkins",
  email: "noah.jenkins@example.com",
  avgMPG: 6.8,  // ← NEW FIELD
  status: "active",
  completedLoads: 47,
  totalLoads: 52,
  // ... other fields
}
```

## Verification

After running the script, you can verify the updates by:

1. **Check Firestore Console**
   - Go to Firebase Console → Firestore
   - Navigate to `drivers` collection
   - Click any driver document
   - Verify `avgMPG` field exists

2. **Test in App**
   - Sign in as a driver (any test driver)
   - Go to Dashboard
   - Check "Avg MPG" in Performance Overview
   - Go to Analytics → Fuel & Efficiency section
   - Verify MPG value matches the driver's assigned value

## Technical Details

### Files Modified
- `scripts/drivers-data-v4-enhanced.ts` - Added avgMPG to interface and all driver records
- `scripts/update-driver-mpg.ts` - New script to update Firestore
- `scripts/run-update-driver-mpg.sh` - Bash script to run the update

### Firestore Update
```typescript
await updateDoc(driverDocRef, {
  avgMPG: driver.avgMPG,
});
```

### Dashboard Integration
The dashboard already pulls MPG from driver profiles:
```typescript
// app/(driver)/dashboard.tsx (line 209)
<AnalyticsCard
  title="Avg MPG"
  value={(firestoreProfile?.avgMPG ?? analytics.avgMpg).toFixed(1)}
  icon={<Fuel size={18} color={Colors.light.accent} />}
  color={Colors.light.accent}
/>
```

## Troubleshooting

### If script fails:
1. Check `.env` file has correct Firebase credentials
2. Verify Firebase permissions
3. Check console for specific error messages

### If MPG doesn't show in app:
1. Clear app cache and reload
2. Sign out and sign back in
3. Check Firestore Console to verify data was updated

### If you see "Driver not found":
- The driver might not exist in Firestore yet
- Run the seed script first: `./scripts/run-seed-command-center-v4.sh`

## Benefits

✅ **Realistic Data** - MPG values match real semi-truck performance  
✅ **Live Analytics** - Dashboard shows actual driver data  
✅ **No Manual Entry** - Drivers don't need to enter MPG separately  
✅ **Accurate Calculations** - Fuel costs and profits calculated correctly  
✅ **Easy Testing** - Each driver has different MPG for varied testing  
✅ **Production Ready** - Structure supports live driver data when deployed

## Next Steps

After running this update:

1. ✅ All 25 test drivers will have MPG values
2. ✅ Dashboard will show live data from profiles
3. ✅ Analytics will calculate based on real MPG
4. ✅ Load details will show accurate fuel costs

When you go live with real drivers:
- Drivers can update their MPG in their profile settings
- MPG can be calculated automatically from trip data
- Admin can update driver MPG from admin panel

---

**Ready to update?** Run: `./scripts/run-update-driver-mpg.sh`
