# LoadRush Test Data Restoration Guide

## Overview
This guide explains how to restore and seed test data for the LoadRush platform, ensuring all drivers and loads are visible across the entire application.

## What Gets Created

### 15 Test Drivers
Drivers with varied statuses and realistic locations:
- **In Transit (7 drivers)**: Jake Miller, John Davis, Mike Johnson, Emily Chen, Robert Taylor, Chris Brown, Kevin Garcia
- **Pickup (3 drivers)**: Sarah Lopez, David Martinez, Jennifer White
- **Accomplished (3 drivers)**: Tony Reed, Lisa Anderson, Amanda Wilson
- **Breakdown (2 drivers)**: Rachel Carter, Michelle Lee

Each driver includes:
- Unique driver ID (DRV-001 to DRV-015)
- GPS coordinates (lat/lng)
- Current load assignment (if active)
- Pickup/dropoff locations
- ETA and distance remaining
- Contact info (phone, email)
- Truck information (make, model, year)

### 15 Test Loads
Loads with varied routes and statuses:
- **In Transit (9 loads)**: Active deliveries across the country
- **Matched (3 loads)**: Assigned to drivers, ready to start
- **Available (2 loads)**: Open for driver assignment
- **Delivered (1 load)**: Completed delivery

Each load includes:
- Full pickup/dropoff addresses with coordinates
- Load type (Electronics, Auto Parts, Furniture, etc.)
- Cargo details (weight, description)
- Pricing ($450 - $6,200)
- Distance (173 - 3,085 miles)
- Rate per mile ($1.69 - $3.95)
- Shipper ID assignment
- 30-day expiration

## Routes Covered
- Dallas, TX → Houston, TX
- Houston, TX → Los Angeles, CA
- Los Angeles, CA → Phoenix, AZ
- Phoenix, AZ → Chicago, IL
- Chicago, IL → Atlanta, GA
- Atlanta, GA → Miami, FL
- Miami, FL → Orlando, FL
- Orlando, FL → Seattle, WA
- Seattle, WA → Portland, OR
- Portland, OR → Denver, CO
- Denver, CO → Las Vegas, NV
- Las Vegas, NV → San Francisco, CA
- San Francisco, CA → New York, NY
- New York, NY → Boston, MA
- Boston, MA → Philadelphia, PA

## How to Run the Seed Script

### Method 1: Using npm script (Recommended)
```bash
npm run seed-test-data
```

### Method 2: Direct execution
```bash
npx tsx scripts/seed-test-data.ts
```

### Method 3: Using the shell script
```bash
chmod +x scripts/run-seed-test-data.sh
./scripts/run-seed-test-data.sh
```

## What the Script Does

1. **Clears Existing Data**: Removes all existing drivers and loads from Firestore
2. **Seeds Drivers**: Creates 15 test drivers with varied statuses
3. **Seeds Loads**: Creates 15 test loads with varied routes and statuses
4. **Provides Summary**: Shows what was created and where to view it

## Where to View the Data

### Driver App
1. Sign in as a driver
2. Navigate to "Loads" tab
3. See available loads (status: "Available")
4. View assigned loads if driver has active deliveries

### Shipper Dashboard
1. Sign in as a shipper
2. View "Loads" section
3. See posted loads (status: "posted", "matched", "in_transit")
4. Track active deliveries

### Admin Command Center
1. Long-press the LoadRush logo on auth screen
2. Navigate to Admin → Command Center
3. View all 15 drivers on the map with real-time statuses
4. See color-coded markers:
   - 🔴 Red: Breakdown
   - 🟠 Orange: In Transit
   - 🟢 Green: Pickup
   - 🔵 Blue: Accomplished

### Admin Loads Management
1. Access Admin panel
2. Navigate to "Loads" section
3. View all 15 loads with filters:
   - All
   - Pending (posted/matched)
   - Active (in_transit)
   - Delivered
   - Cancelled
4. Search by shipper ID, driver ID, or city

## Testing Across Platforms

### iPad/Mobile
1. Scan the QR code from your development server
2. Open the app on your device
3. Sign in with appropriate role
4. Navigate to relevant sections

### Web Browser
1. App is already running in your browser
2. Sign in with appropriate role
3. Navigate to relevant sections

### Command Center Map
1. Best viewed on larger screens (iPad/Desktop)
2. Shows real-time driver locations
3. Interactive markers with driver details
4. Status filtering and search

## Data Persistence

- All data is stored in Firestore
- Loads expire after 30 days (configurable)
- Driver locations update in real-time
- Status changes reflect immediately across all platforms

## Security Rules

The script respects your existing Firestore security rules:
- Drivers can only see available loads
- Shippers can only see their own loads
- Admins have full visibility
- All writes are authenticated

## Troubleshooting

### No data appears after seeding
1. Check console for errors during seeding
2. Verify Firebase connection in `config/firebase.ts`
3. Check Firestore security rules
4. Ensure you're signed in with the correct role

### Drivers not showing on Command Center
1. Verify the `drivers` collection exists in Firestore
2. Check that driver documents have required fields:
   - `location` (lat/lng)
   - `status`
   - `name`
   - `updatedAt`

### Loads not appearing in Driver app
1. Verify loads have `status: "Available"`
2. Check that loads have valid `expiresAt` timestamp (future date)
3. Ensure `pickupLatitude`, `pickupLongitude`, `dropoffLatitude`, `dropoffLongitude` are numbers

### Script fails with permission errors
1. Verify Firebase credentials in `.env`
2. Check Firestore security rules allow writes
3. Ensure you have admin access to the Firebase project

## Re-running the Script

You can safely re-run the script multiple times:
- It will clear existing test data first
- Then create fresh test data
- No duplicate data will be created

## Customizing Test Data

To modify the test data:
1. Edit `scripts/seed-test-data.ts`
2. Modify the `testDrivers` or `testLoads` arrays
3. Add/remove entries as needed
4. Re-run the script

## Production Considerations

⚠️ **WARNING**: This script is for testing only!

- Do NOT run in production
- It will DELETE all existing drivers and loads
- Use only in development/staging environments
- Consider creating a separate script for production data migration

## Next Steps

After seeding:
1. Test driver load assignment flow
2. Verify shipper can post new loads
3. Test admin Command Center functionality
4. Verify real-time updates across platforms
5. Test filtering and search functionality
6. Validate GPS tracking and routing

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Verify Firebase configuration
3. Review Firestore security rules
4. Check network connectivity
5. Ensure all dependencies are installed

## Summary

This seeding script provides a complete test environment with:
- ✅ 15 realistic test drivers
- ✅ 15 varied test loads
- ✅ Multiple statuses (pickup, in_transit, accomplished, breakdown)
- ✅ Cross-country routes
- ✅ Realistic pricing and distances
- ✅ Full GPS coordinates
- ✅ 30-day expiration
- ✅ Visible across all platforms
- ✅ Ready for beta testing

Your LoadRush platform is now fully populated with test data and ready for comprehensive testing!
