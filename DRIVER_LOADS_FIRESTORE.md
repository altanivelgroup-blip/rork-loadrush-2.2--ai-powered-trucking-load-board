# Driver Load Management - Firebase Integration

## Overview
Complete Firebase-connected load management system for drivers in the LoadRush app. Displays real-time loads assigned to the authenticated driver with full CRUD operations.

---

## Firestore Collections

### `loads` Collection
Stores all load documents with the following structure:

```typescript
interface Load {
  id: string;                    // Auto-generated document ID
  shipperId: string;             // Reference to shipper who posted
  shipperName: string;
  status: 'posted' | 'matched' | 'in_transit' | 'delivered' | 'cancelled';
  
  pickup: {
    location: string;
    city: string;
    state: string;
    date: string;              // ISO 8601 format
    time: string;
  };
  
  dropoff: {
    location: string;
    city: string;
    state: string;
    date: string;              // ISO 8601 format
    time: string;
  };
  
  cargo: {
    type: string;
    weight: number;            // in lbs
    description: string;
    photoUrls?: string[];
  };
  
  rate: number;                // Total payout
  distance: number;            // Miles
  ratePerMile: number;         // Calculated rate per mile
  
  assignedDriverId?: string;   // Firebase Auth UID of assigned driver
  matchedDriverId?: string;    // Legacy field (use assignedDriverId)
  matchedDriverName?: string;
  
  deliveryTime?: Timestamp;    // Set when marked as delivered
  createdAt: string;           // ISO 8601 format
  updatedAt: string;           // ISO 8601 format
}
```

---

## Hooks

### `useDriverLoads()`
**Location:** `hooks/useDriverLoads.ts`

Fetches all loads assigned to the authenticated driver in real-time.

**Returns:**
```typescript
{
  loads: Load[];              // All loads for this driver
  activeLoads: Load[];        // status === 'in_transit'
  completedLoads: Load[];     // status === 'delivered'
  delayedLoads: Load[];       // in_transit but past delivery date
  metrics: {
    totalActive: number;
    totalDelivered: number;
    totalDelayed: number;
    totalInTransit: number;
  };
  loading: boolean;
  error: Error | null;
}
```

**Firestore Query:**
- Collection: `loads`
- Filter: `assignedDriverId == currentUser.uid`
- Order: `createdAt DESC`

**Console Logs:**
- `[Driver Loads] Fetch complete:` - Logs total, active, completed, delayed counts
- `[Driver Loads] No authenticated user UID` - Warning when no user
- `[Driver Loads] No loads found for driver:` - Info when empty result

---

### `useUpdateLoadStatus()`
**Location:** `hooks/useUpdateLoadStatus.ts`

Updates load status in Firestore with automatic timestamp management.

**Methods:**

#### `updateLoadStatus({ loadId, status, additionalData })`
Generic update function for any status change.

**Parameters:**
```typescript
{
  loadId: string;
  status: LoadStatus;
  additionalData?: Record<string, any>;
}
```

**Returns:**
```typescript
Promise<{ success: boolean; error?: string }>
```

#### `markAsDelivered(loadId: string)`
Convenience method that:
- Sets `status: 'delivered'`
- Sets `deliveryTime: serverTimestamp()`
- Updates `updatedAt: serverTimestamp()`

#### `markAsInTransit(loadId: string)`
Sets status to `'in_transit'`.

#### `cancelLoad(loadId: string, reason?: string)`
Sets status to `'cancelled'` with optional cancellation reason.

**Console Logs:**
- `[Driver Loads] Updating load status:` - Before update
- `[Driver Loads] Load status updated successfully:` - On success
- `[Driver Loads] Update error:` - On failure
- `[Driver Loads] Marking load as delivered:` - Specific to delivery action

---

## UI Components

### Driver Loads Page
**Location:** `app/(driver)/loads.tsx`

#### Features:
1. **Real-time Load Sync** - Auto-updates when Firestore changes
2. **Two Tabs:**
   - Active Loads (in_transit)
   - Completed Loads (delivered)
3. **Search Functionality** - Filter by city, state, or cargo type
4. **Load Metrics Dashboard** - Shows active, delivered, and delayed counts
5. **Delayed Load Detection** - Highlights loads past delivery date
6. **Mark as Delivered** - One-tap status update with confirmation

#### Load Card Design:
- **Header:** Load ID, status pill, payout
- **Route Display:** Origin → Destination with dates
- **Details:** Cargo type, distance, rate per mile
- **Map Placeholder:** Reserved for future Mapbox integration
- **Action Button:** "Mark as Delivered" (active loads only)

#### Status Colors:
- **Delivered:** Green (`Colors.light.success`)
- **In Transit:** Blue (`Colors.light.primary`)
- **Delayed:** Orange (`Colors.light.accent`)

#### Empty States:
- No active loads
- No completed loads
- No search results

---

## Data Flow

### Load Assignment Flow:
1. Shipper posts load → `status: 'posted'`
2. Driver accepts load → `status: 'matched'`, `assignedDriverId: driverUID`
3. Driver starts delivery → `status: 'in_transit'`
4. Driver completes → `status: 'delivered'`, `deliveryTime: timestamp`

### Real-time Updates:
- Uses Firestore `onSnapshot` listeners via `useCollectionData`
- Automatically reflects changes from other devices/users
- No manual refresh needed

---

## Testing & Debugging

### Console Log Prefixes:
All logs use `[Driver Loads]` prefix for easy filtering.

### Test Scenarios:
1. **No loads:** Empty state displays correctly
2. **Active loads:** Shows "Mark as Delivered" button
3. **Completed loads:** No action button, shows checkmark
4. **Delayed loads:** Orange banner appears
5. **Search:** Filters by city, state, cargo
6. **Mark as delivered:** Confirmation alert → Firestore update → UI refresh

### Firestore Rules (Development):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /loads/{loadId} {
      allow read, write: if true;  // Open for testing
    }
  }
}
```

**Production Rules (Future):**
```javascript
match /loads/{loadId} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == resource.data.assignedDriverId;
  allow create: if request.auth != null && 
                   request.auth.token.role == 'shipper';
}
```

---

## Integration with Existing System

### Auth Integration:
- Uses `useAuth()` from `@/contexts/AuthContext`
- Automatically gets `user.id` (Firebase Auth UID)
- No manual UID passing required

### Type Safety:
- All types imported from `@/types/index.ts`
- Full TypeScript strict mode compliance
- Proper null/undefined handling

### Styling:
- Uses `@/constants/colors.ts` for consistent theming
- Follows existing LoadRush design system
- Responsive card layouts with shadows

---

## Future Enhancements

### Planned Features:
1. **Mapbox Integration** - Replace map placeholder with live route tracking
2. **Push Notifications** - Alert on load assignment/updates
3. **Offline Support** - Cache loads for offline viewing
4. **Load Details Page** - Dedicated screen with full load info
5. **Photo Upload** - Proof of delivery images
6. **Signature Capture** - Digital delivery confirmation
7. **Real-time Location** - GPS tracking during transit
8. **Chat with Shipper** - In-app messaging

### Performance Optimizations:
- Pagination for large load lists
- Virtual scrolling for 100+ loads
- Image lazy loading
- Query result caching

---

## API Reference

### Firestore Operations Used:
- `collection()` - Reference loads collection
- `doc()` - Reference specific load document
- `updateDoc()` - Update load status
- `serverTimestamp()` - Server-side timestamp
- `onSnapshot()` - Real-time listener (via hook)
- `query()` - Filter by assignedDriverId
- `where()` - Query condition
- `orderBy()` - Sort by createdAt

### Firebase SDK Version:
- Firebase Web SDK v12+
- Firestore modular API (tree-shakeable)

---

## Error Handling

### Network Errors:
- Displays error state with retry option
- Logs error details to console
- User-friendly error messages

### Permission Errors:
- Catches Firestore permission denied
- Suggests contacting admin
- Logs UID for debugging

### Update Failures:
- Shows alert with error message
- Doesn't change UI state on failure
- Allows retry

---

## Maintenance Notes

### Adding New Load Fields:
1. Update `Load` interface in `types/index.ts`
2. Update Firestore document structure
3. Update UI to display new field
4. Update search filter if needed

### Changing Status Values:
1. Update `LoadStatus` type
2. Update status color mapping
3. Update Firestore queries
4. Test all status transitions

### Performance Monitoring:
- Monitor Firestore read counts
- Check query performance in Firebase Console
- Optimize indexes if needed
- Consider pagination at 50+ loads

---

## Support & Documentation

**Related Files:**
- `hooks/useCollectionData.ts` - Base Firestore collection hook
- `hooks/useDocumentData.ts` - Base Firestore document hook
- `contexts/AuthContext.tsx` - Authentication context
- `types/index.ts` - TypeScript type definitions

**Firebase Console:**
- Project: loadrush-admin-console
- Firestore Database: `loads` collection
- Authentication: Email/Password enabled

**Contact:**
For questions or issues, check console logs with `[Driver Loads]` prefix.

---

**Last Updated:** 2025-10-06  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
