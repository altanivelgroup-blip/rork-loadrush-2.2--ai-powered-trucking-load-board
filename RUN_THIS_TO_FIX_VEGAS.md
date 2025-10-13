# 🚀 Quick Fix: Make Vegas Data Visible

## The Problem
Vegas drivers and loads from CSV files aren't showing up in the app.

## The Solution (Already Implemented)
✅ Fixed driver ID matching between Firebase Auth and Firestore
✅ Updated queries to use correct driver IDs
✅ Created seeding script for Vegas data

## What You Need to Do NOW

### Step 1: Seed the Data
Run this command in your terminal:

```bash
node scripts/quick-seed-vegas.js
```

**Expected output:**
```
🚀 Starting Vegas Data Seeding...
============================================================

📦 Seeding Drivers...
  ✅ Driver DRV-LV-001: Alex Martinez at (36.1009, -115.2956)
  ✅ Driver DRV-LV-002: Brianna Chen at (36.0840, -115.1537)
  ...
✅ Drivers seeded: 10

📦 Seeding Shippers...
  ✅ Shipper SHP-LV-001: Walmart #2593
  ...
✅ Shippers seeded: 5

📦 Seeding Loads...
  ✅ Load LR-LVLV-2001 matched to driver DRV-LV-001
  ...
✅ Loads seeded: 30+

============================================================
✅ Vegas Data Seeding Complete!
```

### Step 2: Test as Driver
1. Open your app
2. Log in with: `alex.martinez@example.com`
3. You should now see:
   - ✅ Loads assigned to you
   - ✅ Vegas pickup/dropoff locations
   - ✅ Ability to accept and navigate loads

### Step 3: Test as Admin
1. Log in as admin
2. Go to Command Center
3. You should now see:
   - ✅ 10 Vegas drivers on the map
   - ✅ Driver locations in Las Vegas area
   - ✅ Real-time driver status updates

## Test Accounts

| Email | Driver ID | Role |
|-------|-----------|------|
| alex.martinez@example.com | DRV-LV-001 | Driver |
| brianna.chen@example.com | DRV-LV-002 | Driver |
| david.nguyen@example.com | DRV-LV-003 | Driver |
| admin@loadrush.com | - | Admin |

## If It Still Doesn't Work

Check the browser console for these logs:
```
[resolveUserRole] Querying drivers by email: alex.martinez@example.com
[resolveUserRole] Enhanced profile found in drivers! Doc ID: DRV-LV-001
[Driver Loads] Setting up listeners for driverId: DRV-LV-001
[Driver Loads] Matched loads snapshot merged: 1
```

If you see `driverId: undefined` or `No loads found`, the seeding didn't work. Run the script again.

## Quick Verification

After seeding, check Firestore Console:
1. Go to `drivers` collection → Should see `DRV-LV-001` through `DRV-LV-010`
2. Go to `loads` collection → Should see `LR-LVLV-*` and `LR-LVLA-*` loads
3. Check a load document → `matchedDriverId` should be `DRV-LV-001` (not a Firebase UID)

---

**That's it!** The code changes are already done. Just run the seeding script and test.
