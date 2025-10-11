# LoadRush Data Restoration Guide

## 🎯 Purpose
This script restores all test loads to your LoadRush platform, making them visible across:
- **Driver App**: Available loads for drivers to view and accept
- **Shipper Dashboard**: Posted and tracked loads
- **Admin Command Center**: All loads with various statuses

## 📦 What Gets Created

### Total: 23 Loads

#### 🟢 Available Loads (12)
These appear in the Driver app's "Loads" tab:
- LR-001 through LR-012
- Various routes from California to Texas, Arizona, New Mexico
- Different vehicle types: Car Hauler, Hotshot, Flatbed, Box Truck
- Rate per mile: $2.35 - $2.80
- Total pay: $979 - $3,932

#### 🟡 In-Transit/Assigned Loads (7)
These appear in Shipper dashboard as active shipments:
- LR-013 through LR-019
- Assigned to specific drivers
- Currently in transit or assigned
- Tracked with driver names and phone numbers

#### 🟣 Completed Loads (4)
These appear in delivery history:
- LR-020 through LR-023
- Delivered on 10/8
- Includes driver information and delivery notes

## 🚀 How to Run

### Option 1: Using the Shell Script (Recommended)
```bash
chmod +x scripts/run-seed-loadrush.sh
./scripts/run-seed-loadrush.sh
```

### Option 2: Direct Execution
```bash
bun --bun scripts/seed-loadrush-data.ts
```

## 📊 Data Structure

Each load includes:
- **Load ID**: Unique identifier (LR-001, LR-002, etc.)
- **Route**: Pickup city/state → Dropoff city/state
- **Distance**: Miles between pickup and dropoff
- **Rate**: Per mile rate and total pay
- **Vehicle Type**: Car Hauler, Hotshot, Flatbed, Box Truck
- **Status**: Available, matched, in_transit, or delivered
- **Shipper Info**: Company name, email, contact
- **Notes**: Special instructions and requirements
- **Timestamps**: Created date, expiration date (30 days)

## 🔍 Verification

After running the script, verify the data:

### Driver App
1. Sign in as driver: `driver@loadrush.com`
2. Navigate to "Loads" tab
3. Should see 12 available loads
4. Loads should show:
   - Route information
   - Rate and total pay
   - Distance
   - Vehicle type required

### Shipper Dashboard
1. Sign in as shipper: `shipper@loadrush.com`
2. Navigate to "Loads" tab
3. Should see all 23 loads
4. Filter by status:
   - Active: 7 loads
   - Pending: 0 loads
   - Delivered: 4 loads
   - All: 23 loads

### Admin Command Center
1. Long-press the LoadRush logo
2. Navigate to "Loads" in admin panel
3. Should see all 23 loads
4. Can filter by status and search

## ⚠️ Important Notes

1. **Clears Existing Data**: This script will DELETE all existing loads before seeding new ones
2. **Shipper ID**: All loads are assigned to shipper ID: `K6JAh3s9jzdB0Usj2dkw4bmXdUk1`
3. **Expiration**: Loads expire after 30 days
4. **Status Mapping**:
   - `Available` → `Available` (visible to drivers)
   - `assigned` → `matched` (assigned to driver)
   - `inTransit` → `in_transit` (currently being delivered)
   - `completed` → `delivered` (delivery complete)

## 🐛 Troubleshooting

### No loads appearing in Driver app
- Check that you're signed in as a driver
- Verify loads have status "Available"
- Check console logs for Firestore errors

### No loads appearing in Shipper dashboard
- Verify you're signed in with the correct shipper account
- Check that shipper ID matches: `K6JAh3s9jzdB0Usj2dkw4bmXdUk1`
- Look for Firestore permission errors in console

### Script fails to run
- Ensure Firebase is properly configured
- Check that `config/firebase.ts` has correct credentials
- Verify you have write permissions to Firestore

## 📝 Sample Load Data

```typescript
{
  loadId: "LR-001",
  pickupCity: "Los Angeles",
  pickupState: "CA",
  dropoffCity: "Phoenix",
  dropoffState: "AZ",
  distanceMiles: 372,
  ratePerMile: 2.65,
  totalPay: 986,
  vehicleType: "Car Hauler",
  status: "Available",
  notes: "3 sedans; flexible pickup; open delivery window"
}
```

## 🎉 Success Indicators

After successful seeding, you should see:
- ✅ Console message: "Successfully created 23/23 loads"
- ✅ Driver app shows 12 available loads
- ✅ Shipper dashboard shows all 23 loads
- ✅ Admin panel can view and filter all loads
- ✅ No Firestore errors in console

## 🔄 Re-running the Script

You can safely re-run this script multiple times. It will:
1. Clear all existing loads
2. Seed fresh data
3. Reset all timestamps and expiration dates

This is useful for:
- Testing with fresh data
- Resetting after testing
- Recovering from data corruption
