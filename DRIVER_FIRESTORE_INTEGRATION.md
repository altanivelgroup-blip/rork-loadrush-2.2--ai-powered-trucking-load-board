# Driver Firestore Integration

## Overview
The Driver Profile and Dashboard are now connected to Firebase Firestore with real-time data syncing for the `driver@loadrush.com` user account.

## Firestore Collections Structure

### 1. `/drivers/{uid}` - Driver Profile Data
Stores driver profile information linked by Firebase Auth UID.

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated document ID (matches uid)
  firstName: string;             // Driver's first name
  lastName: string;              // Driver's last name
  phone: string;                 // Contact phone number
  email: string;                 // Email address
  dotNumber: string;             // DOT registration number
  mcNumber: string;              // MC number
  truckInfo: {
    make: string;                // Truck manufacturer (e.g., "Freightliner")
    model: string;               // Truck model
    year: number;                // Year of manufacture
    vin: string;                 // Vehicle identification number
    mpg: number;                 // Miles per gallon
    fuelType?: string;           // Optional fuel type
    photoUrl?: string;           // Optional truck photo URL
  };
  trailerInfo: {
    type: string;                // Trailer type (e.g., "Dry Van")
    length: number;              // Length in feet
    capacity: number;            // Weight capacity in lbs
    photoUrl?: string;           // Optional trailer photo URL
  };
  equipment: string[];           // Array of equipment (e.g., ["GPS", "ELD"])
  wallet: number;                // Current wallet balance
  documents: {
    cdl?: string;                // CDL document URL
    insurance?: string;          // Insurance document URL
    permits?: string[];          // Array of permit URLs
  };
  maintenanceRecords: Array<{
    id: string;
    date: string;
    mileage: number;
    type: string;
    description: string;
    cost: number;
    nextServiceMileage?: number;
    nextServiceDate?: string;
  }>;
}
```

### 2. `/driverStats/{uid}` - Driver Statistics
Real-time statistics and performance metrics.

**Document Structure:**
```typescript
{
  id: string;                    // Matches driver uid
  totalLoads: number;            // Total loads hauled
  completedLoads: number;        // Successfully completed loads
  activeLoads: number;           // Currently active loads
  totalEarnings: number;         // Lifetime earnings ($)
  availableBalance: number;      // Available balance for withdrawal ($)
  avgMPG: number;                // Average miles per gallon
  status: 'active' | 'inactive' | 'on_trip';  // Current driver status
}
```

### 3. `/driverAnalytics/{uid}` - Performance Analytics
Detailed analytics for dashboard display.

**Document Structure:**
```typescript
{
  id: string;                    // Matches driver uid
  totalEarnings: number;         // Total earnings ($)
  totalMiles: number;            // Total miles driven
  avgRatePerMile: number;        // Average rate per mile ($)
  loadsCompleted: number;        // Number of completed loads
  avgMpg: number;                // Average MPG
  fuelCost: number;              // Total fuel costs ($)
  netEarnings: number;           // Net earnings after expenses ($)
  trend: 'up' | 'down' | 'stable';  // Performance trend
  trendPercentage: number;       // Trend percentage change
}
```

### 4. `/loads` - Load Collection
All loads in the system (filtered by driver).

**Query for Driver Loads:**
```typescript
// Active loads for specific driver
where('matchedDriverId', '==', driverId)
where('status', 'in', ['matched', 'in_transit'])

// Available loads (not yet matched)
where('status', '==', 'posted')
where('aiScore', '>', 80)  // High-match loads
```

**Document Structure:**
```typescript
{
  id: string;
  shipperId: string;
  shipperName: string;
  status: 'posted' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  pickup: {
    location: string;
    city: string;
    state: string;
    date: string;
    time: string;
  };
  dropoff: {
    location: string;
    city: string;
    state: string;
    date: string;
    time: string;
  };
  cargo: {
    type: string;
    weight: number;
    description: string;
    photoUrls?: string[];
  };
  rate: number;                  // Payment rate ($)
  distance: number;              // Distance in miles
  ratePerMile: number;           // Rate per mile ($)
  matchedDriverId?: string;      // UID of matched driver
  matchedDriverName?: string;    // Name of matched driver
  aiScore?: number;              // AI match score (0-100)
  analytics?: LoadAnalytics;     // Load-specific analytics
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}
```

## Custom Hooks

### `useDriverProfile()`
Fetches and listens to driver profile data in real-time.

```typescript
import { useDriverProfile } from '@/hooks/useDriverData';

const { profile, loading, error } = useDriverProfile();
// profile: DriverProfile | null
// loading: boolean
// error: Error | null
```

### `useDriverStats()`
Fetches and listens to driver statistics in real-time.

```typescript
import { useDriverStats } from '@/hooks/useDriverData';

const { stats, loading, error } = useDriverStats();
// stats: DriverStats | null
```

### `useDriverLoads()`
Fetches all loads assigned to the current driver.

```typescript
import { useDriverLoads } from '@/hooks/useDriverData';

const { loads, activeLoads, completedLoads, loading, error } = useDriverLoads();
// loads: Load[] - All driver's loads
// activeLoads: Load[] - Filtered active loads
// completedLoads: Load[] - Filtered completed loads
```

### `useDriverAnalytics()`
Fetches driver performance analytics.

```typescript
import { useDriverAnalytics } from '@/hooks/useDriverData';

const { analytics, loading, error } = useDriverAnalytics();
// analytics: AnalyticsData | null
```

### `useAvailableLoads()`
Fetches available loads from the marketplace.

```typescript
import { useAvailableLoads } from '@/hooks/useDriverData';

const { availableLoads, matchedLoads, loading, error } = useAvailableLoads();
// availableLoads: Load[] - All posted loads
// matchedLoads: Load[] - High AI-score matches (>80)
```

## Implementation Details

### Driver Profile Page (`app/(driver)/profile.tsx`)
- ✅ Connected to `/drivers/{uid}` collection
- ✅ Connected to `/driverStats/{uid}` collection
- ✅ Real-time updates for profile data
- ✅ Displays: name, email, status, balance, earnings, truck type, experience
- ✅ Loading state with spinner
- ✅ Fallback to AuthContext profile if Firestore data unavailable

**Console Logs:**
```
[Driver Firestore] Profile data: { driverId, data, loading, error }
[Driver Firestore] Stats data: { driverId, data, loading, error }
```

### Driver Dashboard Page (`app/(driver)/dashboard.tsx`)
- ✅ Connected to `/drivers/{uid}` collection
- ✅ Connected to `/driverStats/{uid}` collection
- ✅ Connected to `/driverAnalytics/{uid}` collection
- ✅ Connected to `/loads` collection (filtered by driver)
- ✅ Real-time updates for all data sources
- ✅ Displays: wallet balance, earnings, performance metrics, active loads, AI-matched loads
- ✅ Loading state with spinner
- ✅ Fallback to dummy data if Firestore data unavailable

**Console Logs:**
```
[Driver Firestore] Profile data: { driverId, data, loading, error }
[Driver Firestore] Stats data: { driverId, data, loading, error }
[Driver Firestore] Analytics data: { driverId, data, loading, error }
[Driver Firestore] Loads data: { driverId, total, active, completed, loading, error }
[Driver Firestore] Available loads: { total, matched, loading, error }
```

## Testing Mode

### Current Setup
- ✅ Firestore rules are open (read/write: true) for testing
- ✅ No authentication required for Firestore operations
- ✅ All operations logged with `[Driver Firestore]` prefix
- ✅ Graceful fallback to dummy data when Firestore is empty

### Test Account
- **Email:** `driver@loadrush.com`
- **UID:** Retrieved from Firebase Auth after login
- **Collections:** `/drivers/{uid}`, `/driverStats/{uid}`, `/driverAnalytics/{uid}`, `/loads`

## Next Steps

### For Production
1. **Secure Firestore Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /drivers/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       match /driverStats/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       match /driverAnalytics/{userId} {
         allow read: if request.auth != null && request.auth.uid == userId;
       }
       match /loads/{loadId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```

2. **Add Data Validation:**
   - Validate required fields before writing
   - Add type checking for nested objects
   - Implement error boundaries

3. **Optimize Queries:**
   - Add composite indexes for complex queries
   - Implement pagination for large datasets
   - Cache frequently accessed data

4. **Add Write Operations:**
   - Profile update mutations
   - Load acceptance/rejection
   - Document uploads
   - Wallet transactions

## Future Roles

### Shipper Integration (`shipper@loadrush.com`)
- `/shippers/{uid}` - Shipper profile
- `/shipperStats/{uid}` - Shipper statistics
- `/loads` - Posted loads (filtered by shipperId)

### Admin Integration (`admin@loadrush.com`)
- `/admins/{uid}` - Admin profile
- `/analytics/overall` - System-wide analytics
- Full read access to all collections

## Firestore Console
Access your data at: https://console.firebase.google.com/project/loadrush-admin-console/firestore

## Support
All Firestore operations are logged to the console with the `[Driver Firestore]` prefix for easy debugging.
