# Driver Dashboard - Firebase Integration Guide

## Overview
The Driver Dashboard is now fully connected to Firebase Authentication and Firestore, providing real-time data synchronization for authenticated drivers.

## Architecture

### 1. Authentication Flow
- Uses Firebase Auth UID as the primary identifier
- On login, the system detects the current Auth UID
- The UID is used to query Firestore collections

### 2. Firestore Structure

#### Collection: `drivers`
**Document ID:** Auth UID (e.g., `abc123xyz`)

**Fields:**
```typescript
{
  name?: string;              // Full driver name
  email?: string;             // Driver email
  phone?: string;             // Contact phone
  avgMPG?: number;            // Average miles per gallon
  completedLoads?: number;    // Total completed loads
  totalLoads?: number;        // Total loads (all statuses)
  status?: 'active' | 'offline' | 'banned';  // Current status
  lastActive?: string;        // ISO timestamp of last activity
  
  // Optional extended fields
  firstName?: string;
  lastName?: string;
  dotNumber?: string;
  mcNumber?: string;
  wallet?: number;
  truckInfo?: {...};
  trailerInfo?: {...};
  equipment?: string[];
  documents?: {...};
  maintenanceRecords?: [...];
}
```

#### Collection: `driverStats`
**Document ID:** Auth UID

**Fields:**
```typescript
{
  totalLoads: number;
  completedLoads: number;
  activeLoads: number;
  totalEarnings: number;
  availableBalance: number;
  avgMPG: number;
  status: 'active' | 'inactive' | 'on_trip';
}
```

#### Collection: `loads`
**Query:** `matchedDriverId == Auth UID`

**Fields:**
```typescript
{
  id: string;
  shipperId: string;
  status: 'posted' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  matchedDriverId?: string;  // Links to driver's Auth UID
  pickup: {...};
  dropoff: {...};
  cargo: {...};
  rate: number;
  distance: number;
  // ... other load fields
}
```

#### Collection: `driverAnalytics`
**Document ID:** Auth UID

**Fields:**
```typescript
{
  totalEarnings: number;
  totalMiles: number;
  avgRatePerMile: number;
  loadsCompleted: number;
  avgMpg: number;
  fuelCost: number;
  netEarnings: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}
```

## Implementation

### Hooks (`hooks/useDriverData.ts`)

#### `useDriverProfile()`
Fetches driver profile from `drivers/{uid}` collection.

**Returns:**
```typescript
{
  profile: DriverFirestoreProfile | null;
  loading: boolean;
  error: Error | null;
}
```

**Features:**
- Real-time listener using `onSnapshot`
- Auto-detects Auth UID
- Logs fetch status with `[Driver Firestore]` prefix
- Warns if no profile document exists

#### `useDriverStats()`
Fetches driver statistics from `driverStats/{uid}`.

**Returns:**
```typescript
{
  stats: DriverStats | null;
  loading: boolean;
  error: Error | null;
}
```

#### `useDriverLoads()`
Fetches loads assigned to the driver.

**Query:** `loads` collection where `matchedDriverId == uid`

**Returns:**
```typescript
{
  loads: Load[];
  activeLoads: Load[];      // status: matched | in_transit
  completedLoads: Load[];   // status: delivered
  loading: boolean;
  error: Error | null;
}
```

#### `useDriverAnalytics()`
Fetches analytics data from `driverAnalytics/{uid}`.

**Returns:**
```typescript
{
  analytics: AnalyticsData | null;
  loading: boolean;
  error: Error | null;
}
```

#### `useAvailableLoads()`
Fetches available loads for matching.

**Query:** `loads` collection where `status == 'posted'`

**Returns:**
```typescript
{
  availableLoads: Load[];
  matchedLoads: Load[];     // aiScore > 80
  loading: boolean;
  error: Error | null;
}
```

### Dashboard Component (`app/(driver)/dashboard.tsx`)

#### Loading States
1. **Initial Load:** Shows spinner with "Loading Driver Data..."
2. **No Profile Found:** Shows error screen with UID and "Contact admin" message
3. **Data Loaded:** Displays full dashboard with real-time data

#### UI Components

**Header Section:**
- Driver name (from Firestore `name` field or fallback to `firstName lastName`)
- Email (if available)
- Status pill with color-coded indicator:
  - 🟢 Active (green)
  - ⚪ Offline (gray)
  - 🔴 Banned (red)

**Wallet Card:**
- Current balance (from `driverStats.availableBalance` or `profile.wallet`)
- Last active timestamp with smart formatting:
  - "Just now" (< 1 min)
  - "5m ago" (< 1 hour)
  - "3h ago" (< 24 hours)
  - "2d ago" (< 7 days)
  - Full date (> 7 days)

**Performance Overview:**
- Total Earnings
- Avg Rate/Mile
- Loads Completed (from Firestore `completedLoads`)
- Avg MPG (from Firestore `avgMPG`)

**Active Loads:**
- Real-time list of matched/in-transit loads
- Falls back to dummy data if no Firestore loads

**AI-Matched Loads:**
- Available loads with AI score > 80
- Real-time updates

## Testing

### Console Logs
All Firestore operations log with `[Driver Firestore]` prefix:

```
[Driver Firestore] Profile fetch: { uid: "abc123", hasData: true, loading: false, ... }
[Driver Firestore] Stats fetch: { uid: "abc123", hasData: true, loading: false, ... }
[Driver Firestore] Loads fetch: { uid: "abc123", total: 5, active: 2, completed: 3, ... }
[Driver Firestore] Analytics fetch: { uid: "abc123", hasData: true, loading: false, ... }
```

### Test Scenarios

#### 1. New Driver (No Profile)
- Login with Firebase Auth
- Dashboard shows "No Profile Found" error
- Displays Auth UID for admin reference
- "Sign Out" button available

#### 2. Existing Driver (With Profile)
- Login with Firebase Auth
- Dashboard loads profile from `drivers/{uid}`
- Real-time sync of all data
- Status pill shows current status
- Last active timestamp updates

#### 3. Driver with Loads
- Active loads appear in "Active Loads" section
- Completed loads counted in stats
- AI-matched loads appear in suggestions

#### 4. Offline/Banned Driver
- Status pill shows appropriate color
- All data still accessible
- Admin can update status in Firestore

## Firestore Setup

### Required Collections
1. Create `drivers` collection
2. Create `driverStats` collection (optional)
3. Create `loads` collection
4. Create `driverAnalytics` collection (optional)

### Sample Driver Document
```javascript
// Firestore: drivers/{uid}
{
  name: "John Smith",
  email: "driver@loadrush.com",
  phone: "+1-555-0123",
  avgMPG: 7.2,
  completedLoads: 45,
  totalLoads: 50,
  status: "active",
  lastActive: "2025-10-06T14:30:00Z"
}
```

### Firestore Rules (Development)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Open for testing (CHANGE IN PRODUCTION)
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /drivers/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /driverStats/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
    
    match /loads/{loadId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /driverAnalytics/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## State Management

### Data Priority
1. **Firestore data** (if available)
2. **Fallback to dummy data** (for testing)
3. **Auth context profile** (legacy support)

### Cache Behavior
- Real-time listeners maintain live connection
- Data updates instantly when Firestore changes
- On logout, all listeners are cleaned up
- No local cache persistence (fresh data on each login)

## Error Handling

### No Profile Document
- Shows friendly error message
- Displays Auth UID for admin support
- Provides sign-out option

### Network Errors
- Hooks return error object
- Dashboard falls back to dummy data
- Console logs error details

### Permission Errors
- Logged to console with error details
- User sees loading state or error message

## Future Enhancements

### Planned Features
1. **Offline Support:** Cache data with AsyncStorage
2. **Push Notifications:** Real-time load alerts
3. **Profile Editing:** Update Firestore from app
4. **Photo Uploads:** Firebase Storage integration
5. **Activity Tracking:** Auto-update lastActive timestamp

### Optimization
1. **Pagination:** Limit loads query with cursor
2. **Selective Sync:** Only fetch needed fields
3. **Batch Queries:** Combine multiple reads
4. **Index Creation:** Optimize complex queries

## Troubleshooting

### Issue: "No Profile Found"
**Solution:** Create document in `drivers/{uid}` with required fields

### Issue: Loads not appearing
**Solution:** Ensure `matchedDriverId` field matches Auth UID

### Issue: Real-time updates not working
**Solution:** Check Firestore rules and network connection

### Issue: Status not updating
**Solution:** Update `status` field in `drivers/{uid}` document

## Related Files
- `hooks/useDriverData.ts` - Firestore hooks
- `app/(driver)/dashboard.tsx` - Dashboard UI
- `contexts/AuthContext.tsx` - Authentication
- `config/firebase.ts` - Firebase config
- `hooks/useDocumentData.ts` - Document listener
- `hooks/useCollectionData.ts` - Collection listener

## Support
For issues or questions, check console logs with `[Driver Firestore]` prefix for debugging information.
