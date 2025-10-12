# 🚚 Add Test Loads Guide

This guide will help you add test loads that will be visible on both the **Driver Loads** page and **Shipper My Loads** page.

## 📋 Quick Start

### Option 1: Run the Script (Recommended)

```bash
chmod +x scripts/run-add-test-loads.sh
./scripts/run-add-test-loads.sh
```

### Option 2: Run Directly with Bun

```bash
bun run scripts/add-test-loads-for-users.ts
```

## 🎯 What This Does

The script creates **15 test loads** with the following properties:

- ✅ **Linked to shipper ID**: `shipper-bypass` (shipper@loadrush.co)
- ✅ **Some assigned to driver ID**: `driver-bypass` (driver@loadrush.co)
- ✅ **Random US cities** for pickup and dropoff
- ✅ **Various cargo types** (Electronics, Furniture, Food, etc.)
- ✅ **Different statuses**: `posted`, `matched`, `in_transit`
- ✅ **Expires in 30 days** (won't disappear quickly)
- ✅ **Realistic rates** ($2-4 per mile)

## 📊 Where You'll See the Loads

### Driver Loads Page
When signed in as **driver@loadrush.co** (using quick access):
- ✅ Loads with status `posted`, `matched`, or `in_transit`
- ✅ Loads assigned to this driver
- ✅ All public loads

### Shipper My Loads Page
When signed in as **shipper@loadrush.co** (using quick access):
- ✅ All loads created by this shipper
- ✅ All public loads

## 🔍 How It Works

### The Load Structure

Each load is created with these key fields:

```typescript
{
  shipperId: 'shipper-bypass',           // Links to shipper
  shipperName: 'LoadRush Shipper',
  status: 'posted' | 'matched' | 'in_transit',
  assignedDriverId: 'driver-bypass',     // For in_transit loads
  matchedDriverId: 'driver-bypass',      // For matched/in_transit loads
  pickup: {
    city: 'Los Angeles',
    state: 'CA',
    latitude: 34.0522,
    longitude: -118.2437,
    // ... more fields
  },
  dropoff: {
    city: 'Houston',
    state: 'TX',
    latitude: 29.7604,
    longitude: -95.3698,
    // ... more fields
  },
  cargo: {
    type: 'Electronics',
    weight: 15000,
    description: '...'
  },
  rate: 4500,
  distance: 1500,
  ratePerMile: 3.0,
  expiresAt: Timestamp (30 days from now),
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
}
```

### Why Loads Appear on Each Page

**Driver Loads Page** (`hooks/useDriverLoads.ts`):
- Queries loads where `assignedDriverId == driver-bypass` OR `matchedDriverId == driver-bypass`
- Also shows all public loads with status `posted`, `matched`, or `in_transit`

**Shipper Loads Page** (`hooks/useShipperLoads.ts`):
- Queries loads where `shipperId == shipper-bypass`
- Also shows all public loads with status `posted`, `matched`, or `in_transit`

## 🛠️ Customization

If you want to customize the script, edit `scripts/add-test-loads-for-users.ts`:

### Change the Number of Loads
```typescript
const loadsToCreate = 15;  // Change this number
```

### Change the User IDs
```typescript
const DRIVER_ID = 'driver-bypass';   // Your driver ID
const SHIPPER_ID = 'shipper-bypass'; // Your shipper ID
```

### Add More Cities
```typescript
const US_CITIES = [
  { city: 'Your City', state: 'ST', lat: 00.0000, lng: -00.0000 },
  // ... add more
];
```

### Add More Cargo Types
```typescript
const CARGO_TYPES = [
  { type: 'Your Cargo', weight: 10000 },
  // ... add more
];
```

## 🔧 Troubleshooting

### Loads Not Showing Up?

1. **Check Firebase Connection**
   - Make sure your `.env` file has correct Firebase credentials
   - Check console for Firebase errors

2. **Check User IDs**
   - When using quick access, the IDs are:
     - Driver: `driver-bypass`
     - Shipper: `shipper-bypass`
   - Make sure these match in the script

3. **Check Load Expiration**
   - Loads expire after 30 days by default
   - Check `expiresAt` field in Firestore

4. **Check Load Status**
   - Only loads with status `posted`, `matched`, or `in_transit` show up
   - `delivered` and `cancelled` loads are filtered out

### Still Not Working?

Check the browser console for errors:
```
[Driver Loads] Fetch complete: { ... }
[Shipper Loads] Received X loads from Firestore
```

## 📝 Manual Alternative

If the script doesn't work, you can manually add loads in Firebase Console:

1. Go to Firebase Console → Firestore Database
2. Navigate to `loads` collection
3. Add a new document with these fields:
   - `shipperId`: `shipper-bypass`
   - `status`: `posted`
   - `expiresAt`: Timestamp (30 days from now)
   - `pickup`: Object with city, state, lat, lng
   - `dropoff`: Object with city, state, lat, lng
   - `cargo`: Object with type, weight, description
   - `rate`: Number
   - `distance`: Number
   - `ratePerMile`: Number
   - `createdAt`: Timestamp.now()
   - `updatedAt`: Timestamp.now()

## 🎉 Success!

After running the script, you should see:
- ✅ 15 new loads in Firebase Console
- ✅ Loads visible on Driver Loads page
- ✅ Loads visible on Shipper My Loads page
- ✅ Loads with different statuses and routes

Happy testing! 🚀
