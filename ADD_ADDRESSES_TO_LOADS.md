# Add Addresses to Loads - Fix Navigation

## Problem
Loads in the database don't have real street addresses, preventing the navigation feature from working properly.

## Solution
This script adds real-world street addresses to all loads by:
1. Reading existing loads from Firestore
2. Mapping city names to actual street addresses
3. Updating `pickup.location` and `dropoff.location` with full addresses
4. Skipping loads that already have addresses

## Supported Cities
- Las Vegas, NV
- Los Angeles, CA
- San Diego, CA
- San Francisco, CA
- Phoenix, AZ
- Tucson, AZ
- Riverside, CA
- Bakersfield, CA
- Fresno, CA
- Sacramento, CA

## How to Run

```bash
chmod +x scripts/run-add-addresses-to-loads.sh
./scripts/run-add-addresses-to-loads.sh
```

Or run directly:
```bash
source .env
bun scripts/add-addresses-to-loads.ts
```

## What It Does

1. ✅ Fetches all loads from Firestore
2. ✅ Checks if loads already have full addresses
3. ✅ Assigns real street addresses based on city names
4. ✅ Updates loads in Firestore with new addresses
5. ✅ Shows progress with detailed logging

## Example Output

```
═══════════════════════════════════════════════════════════
🚚 LoadRush: Adding real addresses to loads
═══════════════════════════════════════════════════════════
🔥 Firebase projectId: your-project-id

📦 Fetching loads from Firestore...

Found 45 loads

✅ LR-1234: Las Vegas → Los Angeles
   📍 Pickup: 3355 S Las Vegas Blvd, Las Vegas, NV 89109
   📍 Dropoff: 6801 Hollywood Blvd, Los Angeles, CA 90028

✅ LR-1235: Phoenix → San Diego
   📍 Pickup: 3400 E Sky Harbor Blvd, Phoenix, AZ 85034
   📍 Dropoff: 525 B St, San Diego, CA 92101

⏭️  LR-1236: Already has addresses - skipping

═══════════════════════════════════════════════════════════
✨ Update complete:
   ✅ Updated: 43
   ⏭️  Skipped: 2
   ❌ Failed: 0
═══════════════════════════════════════════════════════════
```

## After Running

All loads will have:
- ✅ Full street addresses in `pickup.location`
- ✅ Full street addresses in `dropoff.location`
- ✅ Navigation feature will work properly
- ✅ Drivers can tap "Navigate to Pickup" and get real directions

## Verification

After running the script, check your driver loads page:
1. Open the app as a driver
2. Go to Loads page
3. Tap on any load
4. Tap "Accept Load"
5. Tap "Navigate to Pickup"
6. ✅ Should open navigation with real addresses

## Notes

- Safe to run multiple times (skips loads with addresses)
- Addresses are randomly selected from a pool per city
- Updates `updatedAt` timestamp
- Preserves all other load data
