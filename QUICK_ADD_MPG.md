# Quick Guide: Add MPG to Driver Profiles

## What This Does
Adds realistic MPG values (6.1 - 7.9) to all 25 test driver profiles so analytics show **LIVE DATA** instead of dummy data.

## Run This Now

```bash
# Make script executable
chmod +x scripts/run-update-driver-mpg.sh

# Run the update
./scripts/run-update-driver-mpg.sh
```

## What You'll See

```
✅ Updated Noah Jenkins (DRV-030): MPG = 6.8
✅ Updated Mia Carter (DRV-031): MPG = 7.2
✅ Updated Ethan Price (DRV-032): MPG = 6.5
...
✅ Successfully updated: 25
```

## Where It Shows Up

1. **Driver Dashboard** → Performance Overview → "Avg MPG" card
2. **Driver Analytics** → Fuel & Efficiency section
3. **Load Details** → Used in fuel cost calculations

## Test It

1. Sign in as any driver
2. Go to Dashboard
3. Check "Avg MPG" card - should show driver's actual MPG
4. Go to Analytics → Fuel & Efficiency
5. Verify MPG matches driver's assigned value

## MPG Values (for reference)

| Best MPG | Average MPG | Lowest MPG |
|----------|-------------|------------|
| 7.9 (Emily Peterson) | 7.0 | 6.1 (Daniel Richardson) |

All values are realistic for Class 8 semi-trucks.

---

**That's it!** After running the script, all driver analytics will use live data from their profiles.

For detailed info, see: [ADD_MPG_TO_DRIVERS.md](./ADD_MPG_TO_DRIVERS.md)
