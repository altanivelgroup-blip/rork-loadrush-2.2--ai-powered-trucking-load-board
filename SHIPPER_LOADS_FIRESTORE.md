# Shipper Loads Firestore Integration

## Overview
The Shipper Loads page is now fully connected to Firebase Firestore, displaying real-time load data for the authenticated shipper.

## Firestore Collection
- **Collection Name**: `loads`
- **Query Filter**: `shipperId == currentUser.uid`
- **Sort Order**: `createdAt` descending (newest first)

## Hook: `useShipperLoads()`
Located in `hooks/useShipperLoads.ts`

### Features
- Real-time data synchronization with Firestore
- Automatic filtering by authenticated shipper's UID
- Optional status filtering (all, active, pending, delivered, cancelled)
- Load metrics calculation
- Error handling and loading states

### Return Values
```typescript
{
  loads: Load[];              // All loads for the shipper
  activeLoads: Load[];        // Loads with status 'in_transit'
  pendingLoads: Load[];       // Loads with status 'posted' or 'matched'
  deliveredLoads: Load[];     // Loads with status 'delivered'
  cancelledLoads: Load[];     // Loads with status 'cancelled'
  metrics: {
    totalActive: number;
    totalPending: number;
    totalDelivered: number;
    totalCancelled: number;
    totalLoads: number;
  };
  loading: boolean;
  error: Error | null;
}
```

## Page: Shipper Loads (`app/(shipper)/loads.tsx`)

### Features Implemented
1. **Real-time Data Fetching**
   - Automatically fetches loads where `shipperId == currentUser.uid`
   - Updates in real-time when Firestore data changes

2. **Status Filters**
   - All: Shows all loads
   - Active: Shows loads with status 'in_transit'
   - Pending: Shows loads with status 'posted' or 'matched'
   - Delivered: Shows loads with status 'delivered'
   - Each filter button displays the count

3. **Sorting Options**
   - Newest First: Sorts by `createdAt` descending
   - Highest Rate: Sorts by `rate` descending

4. **Source Filter**
   - Bulk Import: Filters loads that contain 'bulk' in their ID
   - All: Shows all loads

5. **Load Cards**
   - Color-coded status badges:
     - Pending (Blue): `posted`
     - Matched (Orange): `matched`
     - Active (Green): `in_transit`
     - Delivered (Gray): `delivered`
     - Cancelled (Red): `cancelled`
   - Displays: Status, Rate, Route, Bids
   - Tap to toggle between compact and detailed view

6. **Empty State**
   - Shows "No Loads Posted Yet" when no loads exist
   - Encourages user to post their first load

7. **Loading State**
   - Shows spinner and "Loading your loads..." message

8. **Error State**
   - Displays error message if Firestore query fails

## Data Structure
Each load document in Firestore should have:
```typescript
{
  id: string;
  shipperId: string;           // Firebase Auth UID
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
  };
  rate: number;
  distance: number;
  ratePerMile: number;
  createdAt: string;
  updatedAt: string;
}
```

## Console Logging
All Firestore operations are logged with the `[Shipper Loads]` prefix:
- Query parameters
- Number of loads fetched
- Breakdown by status
- Loading state
- Errors

## Testing
1. Sign in as a shipper user
2. Navigate to the Loads page
3. Verify that only loads with matching `shipperId` are displayed
4. Test status filters (All, Active, Pending, Delivered)
5. Test sorting (Newest First, Highest Rate)
6. Test bulk import filter
7. Verify real-time updates when Firestore data changes

## Future Enhancements
- Add bid count from actual bids collection
- Implement load details modal
- Add load editing functionality
- Add load deletion/cancellation
- Implement pagination for large datasets
- Add search functionality
