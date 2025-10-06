# Admin Loads Management - LoadRush Ground Zero

## Overview
The Admin Loads Management page provides comprehensive control over all loads in the LoadRush system. Admins can view, filter, search, edit, and delete loads regardless of which shipper or driver they belong to.

## Features

### 1. Real-Time Data Sync
- Connected to Firestore `loads` collection
- Automatic updates when data changes
- Live metrics dashboard

### 2. Comprehensive Filtering
- **Status Filters**: All, Pending, Matched, Active, Delivered, Cancelled
- **Search**: Find loads by ID, shipper ID, driver ID, or city names
- **Sorting**: Newest First, Oldest First, Highest Rate

### 3. Load Management Actions
- **Edit Status**: Update load status through modal interface
- **Delete Load**: Permanently remove loads with confirmation
- **View Details**: Complete load information display

### 4. Metrics Dashboard
- Total Loads
- Pending Loads
- Active Loads
- Delivered Loads

### 5. Load Card Information
Each load card displays:
- Status badge (color-coded)
- Rate (USD)
- Route (Origin → Destination)
- Shipper ID/Name
- Driver ID/Name (if matched)
- Created date/time
- Distance in miles

## Technical Implementation

### Hooks Created

#### `useAdminLoads(statusFilter?, searchQuery?)`
Fetches and filters all loads from Firestore.

**Parameters:**
- `statusFilter`: Filter by load status
- `searchQuery`: Search text for filtering

**Returns:**
```typescript
{
  loads: Load[];
  pendingLoads: Load[];
  matchedLoads: Load[];
  activeLoads: Load[];
  deliveredLoads: Load[];
  cancelledLoads: Load[];
  metrics: AdminLoadMetrics;
  loading: boolean;
  error: Error | null;
}
```

#### `useDeleteLoad()`
Deletes a load from Firestore.

**Returns:**
```typescript
{
  deleteLoad: (loadId: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}
```

#### `useUpdateLoadStatus()`
Updates the status of a load.

**Returns:**
```typescript
{
  updateStatus: (loadId: string, newStatus: string) => Promise<boolean>;
  loading: boolean;
  error: Error | null;
}
```

## Status Colors

| Status | Color | Hex |
|--------|-------|-----|
| Posted | Blue | #3B82F6 |
| Matched | Purple | #8B5CF6 |
| Active (In Transit) | Orange | #F59E0B |
| Delivered | Green | #10B981 |
| Cancelled | Red | #EF4444 |

## Security

### Role-Based Access Control
- Only users with `role = "admin"` can access this page
- Non-admin users see "Unauthorized Access" message
- Redirect logic prevents unauthorized access

### Firestore Operations
- Delete operations require confirmation
- All operations logged to console with `[Admin]` prefix
- Error handling with user-friendly messages

## UI Components

### Header
- Page title and subtitle
- Metrics bar with key statistics

### Search Bar
- Real-time search with debouncing
- Clear button when text is entered
- Searches across multiple fields

### Filter Buttons
- Horizontal scrollable list
- Active state highlighting
- Quick status filtering

### Sort Dropdown
- Toggle between sort modes
- Visual indicator of current sort

### Load Cards
- Clean, modern design
- Color-coded status badges
- Route visualization with icons
- Action buttons (Edit/Delete)

### Edit Modal
- Status selection interface
- Visual feedback for selected status
- Confirmation buttons
- Loading states

## Console Logging

All operations are logged with the `[Admin Loads]` prefix:

```
[Admin Loads] Fetch complete: { total: 45, filtered: 12, ... }
[Admin Delete Load] Deleting load: abc123
[Admin Delete Load] Load deleted successfully: abc123
[Admin Update Load] Updating load status: { loadId: 'abc123', newStatus: 'delivered' }
[Admin Update Load] Load status updated successfully
```

## Navigation

The Admin Loads page is accessible via:
- Bottom tab bar (Loads tab)
- Direct route: `/(admin)/loads`

## Empty States

### No Loads
- Package icon
- "No Loads Found" message
- Helpful text based on context

### Search No Results
- "Try adjusting your search or filters"

### Error State
- Error title and message
- User-friendly error descriptions

## Future Enhancements

Potential additions:
- Bulk operations (multi-select)
- Export to CSV/Excel
- Advanced filters (date range, rate range)
- Load assignment interface
- Communication with shipper/driver
- Load history and audit trail
- Analytics and reporting

## Files Created

1. `app/(admin)/loads.tsx` - Main page component
2. `hooks/useAdminLoads.ts` - Load fetching and filtering
3. `hooks/useDeleteLoad.ts` - Load deletion
4. `hooks/useUpdateLoadStatus.ts` - Status updates (updated)
5. `ADMIN_LOADS_MANAGEMENT.md` - This documentation

## Testing

To test the Admin Loads page:

1. Sign in as admin user
2. Navigate to Loads tab
3. Test filtering by status
4. Test search functionality
5. Test sorting options
6. Test edit status modal
7. Test delete with confirmation
8. Verify real-time updates

## Notes

- All Firestore operations are real-time
- No pagination implemented (suitable for moderate load counts)
- Optimized for mobile and web
- Follows LoadRush Ground Zero design system
- Fully typed with TypeScript
