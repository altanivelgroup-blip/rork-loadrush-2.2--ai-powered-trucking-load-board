# LoadRush: Load City Matching Guide

## ✅ Problem Fixed
Loads now dynamically match driver pin locations with real US cities/states instead of defaulting to "Dallas, Texas".

## 🎯 What Changed

### Before
- All loads showed "Dallas, Texas" regardless of driver pin position
- No correlation between map pins and load cities

### After
- Loads use driver pin coordinates to determine origin/destination cities
- Each driver's load matches their actual map location
- 25 assigned loads (one per driver) + 15 open loads
- All loads use real US city coordinates from driver data

## 🚀 Run the Seeding Script

```bash
# Make executable
chmod +x scripts/run-seed-loads-from-drivers.sh

# Run the script
./scripts/run-seed-loads-from-drivers.sh
```

## 📍 How It Works

1. **Driver Locations**: Uses coordinates from `drivers-data-v3.ts`
   - DRV-030: Houston, TX (29.7604, -95.3698)
   - DRV-031: Austin, TX (30.2672, -97.7431)
   - DRV-032: Phoenix, AZ (33.4484, -112.0740)
   - DRV-033: Los Angeles, CA (34.0522, -118.2437)
   - ... and 21 more drivers across USA

2. **Load Generation**:
   - Each driver gets 1 assigned load matching their location
   - Origin = driver's current city (from `cityLabel`)
   - Destination = another driver's city (5-15 positions away)
   - 15 additional open loads using driver cities as endpoints

3. **City Parsing**:
   - Extracts city/state from driver's `cityLabel` field
   - Example: "Houston, TX" → city: "Houston", state: "TX"

4. **Coordinates**:
   - Uses driver's `pickupLocation` for origin coords
   - Uses driver's `dropoffLocation` for destination coords

## 🧪 Verification Steps

### On iPad/Mobile
1. **Open LoadRush app**
2. **Login as Admin** (or role with Command Center access)
3. **Navigate to Command Center**
4. **Check Map**:
   - ✅ All 25 driver pins visible and blinking
   - ✅ Pins positioned across USA (not clustered)
5. **Click a Driver Pin**:
   - ✅ Load details show city matching pin location
   - Example: Pin over Chicago → Load shows "Chicago, IL"
6. **Navigate to Loads Screen**:
   - ✅ Origin/destination cities match driver locations
   - ✅ No "Dallas, Texas" defaults
7. **Check Load Persistence**:
   - ✅ Loads have `expiresAt` 30 days from now
   - ✅ `ttlDays: 30` field present

### On Web
1. **Open browser** → `http://localhost:8081` (or your dev URL)
2. **Follow same steps as iPad**
3. **Additional checks**:
   - ✅ Map renders correctly (react-native-maps web fallback)
   - ✅ Pin tooltips show correct cities
   - ✅ Load cards display city/state properly

## 📊 Expected Output

### Console Output (Seeding)
```
═══════════════════════════════════════════════════════════
🚚 LoadRush: Seeding loads from driver pin locations
═══════════════════════════════════════════════════════════
📍 Using 25 driver locations
⏰ TTL: 30 days
🔥 Firebase projectId: your-project-id

📦 Generated 40 loads (25 assigned + 15 open)
✍️  Writing to Firestore…

📍 LR-830: Houston, TX → Dallas, TX (239 mi)
🚛 LR-831: Austin, TX → Dallas, TX (195 mi)
✅ LR-832: Phoenix, AZ → Los Angeles, CA (372 mi)
🚛 LR-833: Los Angeles, CA → Los Angeles, CA (0 mi)
...

═══════════════════════════════════════════════════════════
✨ Seeding complete → ✅ 40 success, ❌ 0 failed
═══════════════════════════════════════════════════════════
```

### Firestore Data Structure
```typescript
// loads/LR-830
{
  id: "LR-830",
  refId: "LR-830",
  status: "assigned",
  origin: {
    city: "Houston",
    state: "TX",
    coords: { latitude: 29.7604, longitude: -95.3698 }
  },
  destination: {
    city: "Dallas",
    state: "TX",
    coords: { latitude: 32.7767, longitude: -96.7970 }
  },
  assignedDriverId: "DRV-030",
  miles: 239,
  priceUSD: 550,
  expiresAt: Timestamp (30 days from now),
  ttlDays: 30,
  notes: "Load for Noah Jenkins - Houston, TX → Dallas, TX"
}
```

## 🔧 Troubleshooting

### Issue: Script fails with "Bun error"
**Solution**: Script uses Node.js by default. Ensure Node.js is installed:
```bash
node --version  # Should show v18+ or v20+
npm install -g tsx  # TypeScript executor
```

### Issue: Loads still show "Dallas, Texas"
**Solution**: 
1. Clear old data: Delete loads collection in Firestore
2. Re-run seeding script
3. Hard refresh app (Cmd+R on iOS, Ctrl+R on Android)

### Issue: Driver pins not visible
**Solution**: 
1. Verify drivers seeded: `./scripts/run-seed-command-center-v3.sh`
2. Check Firestore `drivers` collection has 25 documents
3. Restart app

### Issue: Cities don't match pins
**Solution**:
1. Check driver data: `cat scripts/drivers-data-v3.ts`
2. Verify `cityLabel` matches coordinates
3. Re-seed loads: `./scripts/run-seed-loads-from-drivers.sh`

## 🎨 Demo Simulation (Optional)

The 5-minute demo simulation is **not included** in this script to keep it focused on city matching. For live driver movement simulation, see:
- `hooks/useDemoSimulation.ts`
- `scripts/seed-command-center-v4.ts`

## 📝 Key Features

✅ **Dynamic City Matching**: Loads use driver pin coordinates  
✅ **30-Day Persistence**: Loads auto-expire after 30 days  
✅ **USA-Only**: All cities are real US locations  
✅ **Visual Testing**: No real routing, just coordinate-based  
✅ **25 Assigned Loads**: One per driver, matching their location  
✅ **15 Open Loads**: Available for assignment, using driver cities  
✅ **Real Distances**: Calculated using Haversine formula  
✅ **Realistic Pricing**: $1.80-$3.00 per mile  

## 🚦 Next Steps

1. **Run the script** (see above)
2. **Verify on iPad/web** (see verification steps)
3. **Test load assignment**: Assign open loads to drivers
4. **Check persistence**: Verify loads still exist after 24 hours
5. **Optional**: Add demo simulation for live pin movement

## 📚 Related Files

- `scripts/seed-loads-from-drivers.ts` - Main seeding script
- `scripts/drivers-data-v3.ts` - Driver location data (25 drivers)
- `scripts/run-seed-loads-from-drivers.sh` - Execution script
- `hooks/useCommandCenterDrivers.ts` - Fetches driver data
- `hooks/useShipperLoads.ts` - Fetches load data
- `app/(admin)/command-center.tsx` - Map UI

---

**Status**: ✅ Ready to test  
**Last Updated**: 2025-10-12  
**Compatibility**: iOS, Android, Web (react-native-maps)
