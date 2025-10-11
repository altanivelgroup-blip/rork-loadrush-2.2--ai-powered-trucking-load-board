# 🎯 Fix Command Center - Show All Drivers

## Problem
Command Center only shows 1 driver instead of multiple drivers with loads.

## Root Cause
The Command Center pulls from the `drivers` collection in Firestore, but only loads were being seeded (not driver documents).

## Solution
Run this script to seed 15 active drivers into the Command Center:

```bash
chmod +x scripts/run-seed-command-center.sh
./scripts/run-seed-command-center.sh
```

Or run directly:
```bash
bun --bun scripts/seed-command-center-drivers.ts
```

## What This Creates

### 15 Active Drivers:
- **3 Pickup Drivers** (🟢) - Ready to pick up loads
- **7 In-Transit Drivers** (🟡) - Currently delivering
- **4 Accomplished Drivers** (🟣) - Completed deliveries
- **1 Breakdown Driver** (🔴) - Experiencing issues

### Each Driver Has:
- ✅ Unique Driver ID (DRV-001 to DRV-015)
- ✅ Name and phone number
- ✅ Current GPS location
- ✅ Status indicator
- ✅ Assigned load ID
- ✅ Pickup and dropoff locations
- ✅ ETA and distance remaining

## After Running

### View in Command Center:
1. Sign in as **admin** (long-press logo on auth screen)
2. Navigate to **"Command"** tab at bottom
3. See all 15 drivers on the live map

### Filter Options:
- Click **"All"** to see all 15 drivers
- Click **"Pickup"** to see 3 drivers ready for pickup
- Click **"In Transit"** to see 7 drivers on the road
- Click **"Accomplished"** to see 4 completed deliveries
- Click **"Breakdown"** to see 1 driver with issues

### Interactive Features:
- Click any driver marker to see popup with details
- Click driver card in sidebar to open detail panel
- Use **Projector Mode** to cycle through drivers automatically
- Use **Playback Mode** to replay driver routes

## Verify It Worked

After running the script, you should see:
- ✅ 15 drivers in the sidebar (not just 1)
- ✅ Multiple colored markers on the map
- ✅ Status counts in filter buttons (e.g., "In Transit: 7")
- ✅ Driver details when clicking markers

## Troubleshooting

If you still see only 1 driver:
1. Check console logs for errors
2. Verify Firebase connection in `.env`
3. Refresh the Command Center page
4. Check Firestore console to confirm drivers were created

## Next Steps

Once drivers are visible:
1. Test filtering by status
2. Click driver markers to see popups
3. Try Projector Mode for presentations
4. Test Playback Mode to replay routes

---

**Note:** This script clears existing drivers and creates fresh test data. Run it anytime you need to reset the Command Center.
