# 🚀 RESTORE TEST DATA NOW - STEP BY STEP

## ⚡ Quick Action Required

Your test loads and drivers have disappeared. Follow these steps to restore them immediately.

---

## 📋 Step 1: Run the Seed Script

Open your terminal and run:

```bash
npm run seed-test-data
```

**What this does:**
- Clears any existing test data
- Creates 15 test drivers with varied statuses
- Creates 15 test loads with varied routes
- Takes about 10-15 seconds

**Expected output:**
```
🚀 Starting LoadRush test data seeding...
📊 This will create:
   - 15 test drivers with varied statuses
   - 15 test loads with varied routes and statuses

🧹 Clearing existing test data...
✅ Deleted X existing documents

🚛 Seeding test drivers...
  ✅ Created driver: Jake Miller (DRV-001) - Status: in_transit
  ✅ Created driver: Sarah Lopez (DRV-002) - Status: pickup
  ... (13 more)

📦 Seeding test loads...
  ✅ Created load 1: Dallas, TX → Houston, TX - Status: in_transit
  ✅ Created load 2: Houston, TX → Los Angeles, CA - Status: matched
  ... (13 more)

============================================================
🎉 SEEDING COMPLETE!
============================================================

📊 Summary:
   ✅ Drivers created: 15/15
   ✅ Loads created: 15/15
```

---

## 📋 Step 2: Verify Data in Driver App

1. **Sign in as Driver**
   - Use your driver credentials
   
2. **Navigate to Loads Tab**
   - You should see available loads
   
3. **Expected Results:**
   - 2-3 loads with status "Available"
   - Each load shows:
     - Pickup/dropoff locations
     - Price and rate per mile
     - Distance
     - Cargo details

**Screenshot checkpoint:** You should see load cards with routes like "Dallas, TX → Houston, TX"

---

## 📋 Step 3: Verify Data in Shipper Dashboard

1. **Sign in as Shipper**
   - Use your shipper credentials
   
2. **Navigate to Loads Section**
   - Check the loads page
   
3. **Expected Results:**
   - Multiple loads visible
   - Status filters working (All, Active, Pending, Delivered)
   - Loads show:
     - Posted loads (status: "posted" or "matched")
     - Active loads (status: "in_transit")
     - Delivered loads (status: "delivered")

**Screenshot checkpoint:** You should see loads with different statuses and filter buttons

---

## 📋 Step 4: Verify Data in Admin Command Center

1. **Access Admin Panel**
   - Long-press the LoadRush logo on auth screen
   - Navigate to Admin section
   
2. **Open Command Center**
   - Click "Command Center" option
   
3. **Expected Results:**
   - Map displays with 15 driver markers
   - Color-coded by status:
     - 🔴 Red: Breakdown (2 drivers)
     - 🟠 Orange: In Transit (7 drivers)
     - 🟢 Green: Pickup (3 drivers)
     - 🔵 Blue: Accomplished (3 drivers)
   - Click markers to see driver details
   - Filter by status works

**Screenshot checkpoint:** Map with multiple colored markers across the US

---

## 📋 Step 5: Verify Data in Admin Loads Management

1. **In Admin Panel**
   - Navigate to "Loads" section
   
2. **Expected Results:**
   - All 15 loads visible
   - Status filters work:
     - All (15 loads)
     - Pending (3 loads: posted/matched)
     - Active (9 loads: in_transit)
     - Delivered (1 load)
     - Cancelled (0 loads)
   - Search functionality works
   - Load details show complete information

**Screenshot checkpoint:** Load list with filter buttons and load cards

---

## 📋 Step 6: Test on iPad/Mobile

1. **Scan QR Code**
   - From your development server
   
2. **Open on Device**
   - App should load with test data
   
3. **Navigate Through Roles**
   - Test driver view
   - Test shipper view
   - Test admin view (long-press logo)
   
4. **Expected Results:**
   - All data visible on mobile
   - Maps render correctly
   - Touch interactions work
   - Status updates reflect

**Screenshot checkpoint:** Mobile app showing loads and Command Center map

---

## 📋 Step 7: Test on Web

1. **Open in Browser**
   - Your app is already running
   
2. **Navigate Through Sections**
   - Test all three roles
   - Check Command Center map
   - Verify load lists
   
3. **Expected Results:**
   - Web version shows all data
   - Maps render (may use web fallback)
   - All interactions work
   - Responsive design adapts

**Screenshot checkpoint:** Web browser showing full Command Center

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Driver app shows 2-3 available loads
- [ ] Shipper dashboard shows multiple loads with filters
- [ ] Admin Command Center displays 15 drivers on map
- [ ] Admin Loads shows all 15 loads with working filters
- [ ] iPad/Mobile app displays all data correctly
- [ ] Web version displays all data correctly
- [ ] Status colors are correct on Command Center
- [ ] Load details show complete information
- [ ] GPS coordinates are valid
- [ ] Real-time updates work (if testing live changes)

---

## 🐛 If Something Goes Wrong

### No data appears after seeding

**Check console output:**
```bash
# Look for errors in the seed script output
# Common issues:
# - Firebase connection error
# - Permission denied
# - Invalid credentials
```

**Verify Firebase connection:**
```bash
# Check config/firebase.ts has correct credentials
# Ensure .env file exists with proper values
```

**Re-run the script:**
```bash
npm run seed-test-data
```

### Drivers not showing on Command Center

**Check Firestore:**
1. Open Firebase Console
2. Navigate to Firestore Database
3. Check `drivers` collection exists
4. Verify documents have required fields:
   - `location` (object with lat/lng)
   - `status` (string)
   - `name` (string)
   - `updatedAt` (timestamp)

**Check console logs:**
```
[useCommandCenterDrivers] Received snapshot with X drivers
```

### Loads not appearing in Driver app

**Check load status:**
- Loads must have `status: "Available"` to show in driver app
- Loads must have valid `expiresAt` (future date)
- Coordinates must be numbers, not strings

**Check console logs:**
```
[Driver Loads] Received X non-expired loads from Firestore
```

### Permission errors

**Verify Firestore rules:**
1. Open Firebase Console
2. Navigate to Firestore Database → Rules
3. Ensure rules allow reads/writes for authenticated users

**Check authentication:**
- Ensure you're signed in with valid credentials
- Check user role matches the view you're testing

---

## 📊 What You Should See

### Driver App - Loads Tab
```
📦 2 loads found

[Load Card]
Dallas, TX → Houston, TX
$850 • 240 mi • $3.54/mi
Electronics • 5,000 lbs
```

### Shipper Dashboard - Loads
```
📦 15 loads found

[All (15)] [Active (9)] [Pending (3)] [Delivered (1)]

[Load Card]
Houston, TX → Los Angeles, CA
Status: In Transit
$3,200 • 1,545 mi
```

### Admin Command Center
```
[Map with 15 markers]
🔴 Rachel Carter - Breakdown
🟠 Jake Miller - In Transit
🟢 Sarah Lopez - Pickup
🔵 Tony Reed - Accomplished
```

### Admin Loads Management
```
📦 15 loads found

[All (15)] [Pending (3)] [Active (9)] [Delivered (1)]

[Load List with filters and search]
```

---

## 🎯 Next Steps After Verification

Once all data is visible:

1. **Test Load Assignment Flow**
   - Driver accepts a load
   - Status updates to "matched"
   - Shipper sees status change

2. **Test Status Updates**
   - Update load status
   - Verify changes reflect across all views

3. **Test Command Center Tracking**
   - Watch driver locations update
   - Test status filters
   - Verify marker colors

4. **Test Search and Filters**
   - Search by city, driver ID, shipper ID
   - Filter by status
   - Sort by different criteria

5. **Test Real-time Updates**
   - Make changes in one view
   - Verify updates in other views
   - Check Firestore listeners working

---

## 📚 Additional Resources

- **Full Guide:** `TEST_DATA_RESTORATION_GUIDE.md`
- **Quick Reference:** `QUICK_START_TEST_DATA.md`
- **Seed Script:** `scripts/seed-test-data.ts`

---

## 🎉 You're Ready!

After completing these steps, your LoadRush platform will have:
- ✅ 15 realistic test drivers
- ✅ 15 varied test loads
- ✅ Full GPS tracking data
- ✅ Multiple statuses for testing
- ✅ Cross-country routes
- ✅ Visible across all platforms
- ✅ Ready for beta testing

**Start with Step 1 now!** 🚀
