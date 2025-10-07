# Driver GPS Tracking Integration

## Overview
The Driver GPS Uploader feature enables real-time location tracking for drivers in the LoadRush app. Driver locations are automatically synced to Firestore every 10 seconds and displayed live on the Admin Command Center map.

## Implementation

### 1. Custom Hook: `hooks/useDriverGPS.ts`

**Purpose**: Manages GPS tracking lifecycle, permissions, and Firestore synchronization.

**Key Features**:
- Requests foreground location permissions on mount
- Uses `expo-location` to watch position changes
- Updates Firestore `drivers/{driverId}` collection every 10 seconds
- Provides mock coordinates for testing when GPS unavailable
- Web-compatible with fallback to mock data
- Automatic cleanup on unmount to prevent battery drain

**API**:
```typescript
const { location, isTracking, error, startTracking, stopTracking } = useDriverGPS(driverId);
```

**Returns**:
- `location`: Current GPS coordinates `{ latitude, longitude, updatedAt }`
- `isTracking`: Boolean indicating if tracking is active
- `error`: Error message if tracking fails
- `startTracking()`: Manually start tracking
- `stopTracking()`: Manually stop tracking

### 2. Driver Dashboard Integration: `app/(driver)/dashboard.tsx`

**GPS Status Card**:
- Displays real-time tracking status (🟢 Active / 🔴 Paused)
- Shows current latitude, longitude, and last update time
- Informs driver that location syncs to Command Center every 10 seconds
- Color-coded status indicators for quick visual feedback

**Visual Design**:
- Green badge when tracking active
- Red badge when tracking paused or permission denied
- Monospace font for coordinates (professional look)
- Subtle border and shadow matching LoadRush theme

### 3. Data Flow

```
Driver App (useDriverGPS)
    ↓
expo-location (watchPositionAsync)
    ↓
Firestore: drivers/{driverId}/location
    ↓
Admin Command Center (useCommandCenterDrivers)
    ↓
Live Map Updates
```

### 4. Firestore Schema

**Collection**: `drivers`  
**Document ID**: `{driverId}` (user UID)

**Location Field**:
```typescript
{
  location: {
    latitude: number,
    longitude: number,
    updatedAt: serverTimestamp()
  }
}
```

## Configuration

### Update Interval
Default: 10 seconds (10,000ms)

To change, modify `UPDATE_INTERVAL` in `hooks/useDriverGPS.ts`:
```typescript
const UPDATE_INTERVAL = 10000; // milliseconds
```

### Distance Threshold
Default: 100 meters

Location updates only trigger if driver moves 100+ meters. Adjust in `watchPositionAsync`:
```typescript
distanceInterval: 100, // meters
```

### Accuracy Level
Default: `Location.Accuracy.Balanced`

Options:
- `Lowest` - City-level accuracy (~10km)
- `Low` - Neighborhood-level (~1km)
- `Balanced` - Block-level (~100m) ✅ Current
- `High` - Street-level (~10m)
- `Highest` - Precise GPS (~1m)

## Permissions

### iOS
Requires `NSLocationWhenInUseUsageDescription` in `app.json`:
```json
{
  "ios": {
    "infoPlist": {
      "NSLocationWhenInUseUsageDescription": "LoadRush needs your location to track deliveries and optimize routes."
    }
  }
}
```

### Android
Requires `ACCESS_FINE_LOCATION` permission (auto-handled by expo-location).

## Testing

### Mock Data
When GPS is unavailable or on web, the hook uses mock coordinates:
- Dallas, TX: `32.7767, -96.7970`
- Houston, TX: `29.7604, -95.3698`
- Los Angeles, CA: `34.0522, -118.2437`
- Phoenix, AZ: `33.4484, -112.0740`

### Test Users
For users with IDs starting with `test-`, Firestore updates are skipped (local-only tracking).

### Console Logs
All GPS events are logged with `[useDriverGPS]` prefix:
- Permission requests
- Location updates
- Firestore sync status
- Errors and warnings

## Security

### Data Privacy
- Only latitude, longitude, and timestamp are stored
- No sensitive data (speed, altitude, heading) is collected
- Location data is only accessible to authenticated admins

### Firestore Rules (Recommended)
```javascript
match /drivers/{driverId} {
  allow read: if request.auth != null && request.auth.token.role == 'admin';
  allow write: if request.auth != null && request.auth.uid == driverId;
}
```

## Performance

### Battery Optimization
- Uses `Balanced` accuracy (not `Highest`)
- 10-second update interval (not continuous)
- 100-meter distance threshold prevents excessive updates
- Automatic cleanup on unmount

### Network Efficiency
- Firestore updates are batched (10-second intervals)
- Uses `serverTimestamp()` to reduce payload size
- No redundant updates if location unchanged

## Troubleshooting

### "Location permission denied"
**Solution**: User must enable location permissions in device settings.

### "Tracking Paused" on web
**Expected**: Web uses mock data. Real GPS only works on native devices.

### Location not updating in Command Center
**Check**:
1. Driver dashboard shows "Tracking Active" (green)
2. Console logs show `[useDriverGPS] Location updated in Firestore`
3. Firestore console shows `location` field in driver document
4. Admin Command Center is listening to correct `drivers` collection

### High battery drain
**Solution**: Increase `UPDATE_INTERVAL` or reduce accuracy level.

## Future Enhancements

- [ ] Background location tracking (requires `expo-task-manager`)
- [ ] Route history and playback
- [ ] Geofencing for pickup/delivery zones
- [ ] Speed and heading data for ETA calculations
- [ ] Offline queue for location updates
- [ ] Driver-controlled tracking toggle

## Related Files

- `hooks/useDriverGPS.ts` - GPS tracking hook
- `app/(driver)/dashboard.tsx` - Driver UI integration
- `hooks/useCommandCenterDrivers.ts` - Admin map data listener
- `app/(admin)/command-center.tsx` - Admin map view

## Support

For issues or questions, check console logs with `[useDriverGPS]` prefix for debugging information.
