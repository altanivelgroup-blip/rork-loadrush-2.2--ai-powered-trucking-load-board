# LoadRush Testing Guide
## Enhanced Command Center with Demo Simulation

### 🎯 Overview
This guide provides step-by-step instructions for testing the LoadRush Command Center with:
- ✅ 25 test drivers with accurate USA city/state labels
- ✅ Real highway assignments (I-45, I-10, I-95, etc.)
- ✅ Blinking pins on react-native-maps
- ✅ 30-day persistent loads (USA-only)
- ✅ Optional 5-minute demo simulation

---

## 📋 Prerequisites

### Required Setup
1. **Firebase Configuration**: Ensure `.env` has valid Firebase credentials
2. **Node/Bun**: Bun installed for running scripts
3. **Expo Go**: Version 53 installed on test devices
4. **Test Accounts**:
   - Admin: `admin@loadrush.com`
   - Shipper: `shipper@loadrush.com`
   - Driver: `driver@loadrush.com`

---

## 🚀 Step 1: Seed Test Data

### A. Seed Enhanced Drivers (25 drivers with accurate cities)

```bash
# Make script executable
chmod +x scripts/run-seed-command-center-v4.sh

# Run the seeder
./scripts/run-seed-command-center-v4.sh
```

**Expected Output:**
```
✅ Seeded: DRV-030 (Noah Jenkins) - Houston, TX on I-45 N
✅ Seeded: DRV-031 (Mia Carter) - Austin, TX on I-35 N
✅ Seeded: DRV-032 (Ethan Price) - Phoenix, AZ on I-10 W
...
🎉 SEEDING COMPLETE!
📊 Summary:
   ✅ Drivers seeded: 25/25
```

### B. Seed Test Loads (23 loads, 30-day persistence)

```bash
# Make script executable
chmod +x scripts/run-seed-loadrush.sh

# Run the seeder
./scripts/run-seed-loadrush.sh
```

**Expected Output:**
```
📦 Seeding LoadRush loads (USA-only, 30-day persistence)...
  📅 Load LR-001 expires: 11/11/2025 (30 days from now)
  ✅ Created load LR-001: Los Angeles, CA → Phoenix, AZ - Status: Available
...
🎉 SEEDING COMPLETE!
📊 Summary:
   ✅ Loads created: 23/23
```

---

## 🧪 Step 2: Verify Data in Firestore

### Check Drivers Collection
1. Open Firebase Console → Firestore Database
2. Navigate to `drivers` collection
3. **Verify**:
   - 25 documents (DRV-030 through DRV-054)
   - Each has `cityLabel`, `state`, `highway` fields
   - `location` coordinates match city positions
   - `updatedAt` and `createdAt` timestamps present

### Check Loads Collection
1. Navigate to `loads` collection
2. **Verify**:
   - 23 documents (LR-001 through LR-023)
   - `expiresAt` timestamp is ~30 days from now
   - `pickup.state` and `dropoff.state` are USA states (CA, TX, AZ, NM)
   - Status varies: `Available`, `matched`, `in_transit`, `delivered`

---

## 📱 Step 3: Test on iPad/Mobile

### A. Launch App on Device
1. Start Expo dev server: `bun start`
2. Scan QR code with Expo Go app
3. Sign in as **admin** user

### B. Navigate to Command Center
1. Tap **Admin** tab
2. Tap **Command Center**
3. Wait for map to load

### C. Verify Visual Elements

#### Map View (Default: Dark Mode)
- [ ] All 25 drivers visible as blinking pins
- [ ] Pins positioned across USA map
- [ ] Different colors for different statuses:
  - 🟢 Green: Pickup
  - 🟠 Orange: In Transit
  - 🟣 Purple: Accomplished
  - 🔴 Red: Breakdown

#### Toggle to React-Native-Maps
1. Tap **"View: Dark"** button in header
2. **Verify**:
   - [ ] Map switches to react-native-maps
   - [ ] All 25 pins still visible
   - [ ] Pins positioned on actual USA map
   - [ ] Can zoom/pan map
   - [ ] Map stays within USA bounds

#### Test Pin Interaction
1. Tap any blinking pin
2. **Verify popup shows**:
   - [ ] Driver name (e.g., "Noah Jenkins")
   - [ ] Driver ID (e.g., "DRV-030")
   - [ ] Status badge with color
   - [ ] **Current Location**: City name matches pin position
     - Example: Pin over Houston shows "Houston, TX"
   - [ ] Current Load ID
   - [ ] ETA and distance (if in transit)

#### Test Sidebar
1. **Verify sidebar shows**:
   - [ ] "Active Drivers: 25"
   - [ ] Legend with 4 status types
   - [ ] Scrollable list of all drivers
2. Tap any driver card
3. **Verify detail panel opens** with:
   - [ ] Driver avatar with initials
   - [ ] Full name and status
   - [ ] Current load info
   - [ ] Route information
   - [ ] Location coordinates

---

## 🌐 Step 4: Test on Web

### A. Launch in Browser
1. Open `http://localhost:8081` (or your Expo web URL)
2. Sign in as **admin**
3. Navigate to Command Center

### B. Web-Specific Features

#### Sidebar Collapse
1. **Verify sidebar toggle button** (left edge of map)
2. Click to collapse sidebar
3. **Verify**:
   - [ ] Sidebar smoothly animates closed
   - [ ] Map expands to full width
   - [ ] Toggle button moves to left edge
4. Click again to expand
5. **Verify**:
   - [ ] Sidebar smoothly animates open
   - [ ] Map resizes accordingly

#### Map Controls
1. **Verify map controls work**:
   - [ ] Zoom in/out with mouse wheel
   - [ ] Pan by clicking and dragging
   - [ ] Map auto-corrects if panned outside USA
2. Click **"View: Dark"** to toggle map view
3. **Verify**:
   - [ ] Smooth transition between views
   - [ ] All drivers remain visible
   - [ ] Map auto-fits to USA region

---

## 🎬 Step 5: Test Demo Simulation (Optional)

### A. Enable Projector Mode
1. In Command Center header, find **"Projector Mode"** toggle
2. Enable the switch
3. **Verify**:
   - [ ] View automatically switches to Map mode
   - [ ] Sidebar hides
   - [ ] Filter bar hides
   - [ ] Large overlay appears showing current driver details

### B. Projector Mode Behavior
1. **Verify overlay cycles** every 15 seconds:
   - [ ] Shows different driver each cycle
   - [ ] Displays driver name, ID, status
   - [ ] Shows load ID, ETA, distance
   - [ ] Smooth fade in/out animations
2. **Verify map stays focused** on USA region
3. **Verify all pins keep blinking**

### C. Disable Projector Mode
1. Toggle **"Projector Mode"** off
2. **Verify**:
   - [ ] Overlay fades out
   - [ ] Sidebar reappears
   - [ ] Filter bar reappears
   - [ ] Can interact with map again

---

## 🔍 Step 6: Verify City Labels Match Pin Positions

### Test Cases

| Driver ID | Expected City | Expected State | Map Position Check |
|-----------|---------------|----------------|-------------------|
| DRV-030 | Houston | TX | Pin over Houston area |
| DRV-031 | Austin | TX | Pin over Austin area |
| DRV-032 | Phoenix | AZ | Pin over Phoenix area |
| DRV-033 | Los Angeles | CA | Pin over LA area |
| DRV-034 | Denver | CO | Pin over Denver area |
| DRV-035 | Chicago | IL | Pin over Chicago area |
| DRV-036 | New York | NY | Pin over NYC area |
| DRV-037 | Miami | FL | Pin over Miami area |
| DRV-038 | Atlanta | GA | Pin over Atlanta area |
| DRV-039 | Seattle | WA | Pin over Seattle area |

### Verification Steps
1. Toggle to **Map View**
2. For each driver in table above:
   - [ ] Locate pin on map
   - [ ] Tap pin to open popup
   - [ ] Verify "Current Location" shows correct city/state
   - [ ] Verify pin is visually positioned over that city on map

---

## ⏱️ Step 7: Test Load Persistence

### A. Check Load Expiration
1. Sign in as **shipper** user
2. Navigate to **Loads** tab
3. Tap any load to view details
4. **Verify**:
   - [ ] Load shows creation date
   - [ ] Load is marked as active/available
   - [ ] No expiration warnings

### B. Verify 30-Day Window
1. Check Firestore Console
2. Open any load document
3. **Verify `expiresAt` field**:
   - [ ] Timestamp is approximately 30 days from `createdAt`
   - [ ] Date is in the future

### C. Test Load Visibility
1. As **driver** user, navigate to **Loads** tab
2. **Verify**:
   - [ ] 12 "Available" loads are visible
   - [ ] Each shows pickup/dropoff cities (USA only)
   - [ ] All routes are within CA, TX, AZ, NM
   - [ ] No expired loads appear

---

## 🐛 Troubleshooting

### Issue: No Drivers Visible
**Solution:**
```bash
# Re-run driver seeder
./scripts/run-seed-command-center-v4.sh
```

### Issue: Pins Not Blinking
**Solution:**
- Check that `active: true` in driver data
- Verify animations are enabled on device
- Try toggling between Dark/Map view

### Issue: City Labels Don't Match Pins
**Solution:**
- Verify you're using v4 enhanced driver data
- Check `cityLabel` and `state` fields in Firestore
- Ensure `location` coordinates are correct

### Issue: Map Won't Load
**Solution:**
- Check internet connection
- Verify Google Maps API key (if using Android)
- Try web version first to isolate platform issues

### Issue: Loads Expired Immediately
**Solution:**
```bash
# Re-run load seeder to reset expiration dates
./scripts/run-seed-loadrush.sh
```

---

## ✅ Success Criteria

### All Tests Pass When:
- [ ] 25 drivers visible with blinking pins
- [ ] City labels accurately match pin positions
- [ ] Can toggle between Dark and Map views
- [ ] Pins remain visible and interactive in both views
- [ ] Popup shows correct city/state for each driver
- [ ] Sidebar shows all 25 drivers
- [ ] 23 loads created with 30-day expiration
- [ ] All loads are USA-only routes
- [ ] Projector mode cycles through drivers
- [ ] Web and mobile versions both work
- [ ] No console errors or crashes

---

## 📊 Test Results Template

```
Date: ___________
Tester: ___________
Platform: [ ] Web [ ] iOS [ ] Android

✅ Data Seeding
  [ ] 25 drivers seeded successfully
  [ ] 23 loads seeded successfully
  [ ] Firestore data verified

✅ Visual Testing
  [ ] All pins visible and blinking
  [ ] City labels match pin positions
  [ ] Map view toggle works
  [ ] Sidebar functional

✅ Interaction Testing
  [ ] Pin taps open popups
  [ ] Popups show correct data
  [ ] Driver cards open detail panels
  [ ] Filters work correctly

✅ Projector Mode
  [ ] Enables/disables smoothly
  [ ] Cycles through drivers
  [ ] Displays correct information

✅ Load Persistence
  [ ] Loads expire in 30 days
  [ ] USA-only routes confirmed
  [ ] Visible to correct user roles

Notes:
_________________________________
_________________________________
_________________________________
```

---

## 🎉 Next Steps

After successful testing:
1. Document any bugs found
2. Take screenshots of working features
3. Test on additional devices if available
4. Verify performance with larger datasets
5. Test edge cases (no internet, slow connection, etc.)

---

**Questions or Issues?**
Check the console logs for detailed debugging information. All components log their state changes and errors.
