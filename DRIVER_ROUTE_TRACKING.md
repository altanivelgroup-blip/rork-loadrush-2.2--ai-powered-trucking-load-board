# Driver Route & ETA Visualization

## Overview
The LoadRush Command Center now displays real-time route lines and ETA calculations for each driver using the Mapbox Directions API.

## Implementation

### 1. Route Hook (`hooks/useDriverRoute.ts`)
A custom hook that fetches route data from Mapbox Directions API:

**Features:**
- Accepts origin (driver's current location) and destination (dropoff location)
- Calls Mapbox Directions API every 30 seconds
- Returns route coordinates, distance (km/miles), and duration (minutes/formatted)
- Auto-updates when driver location changes
- Handles errors gracefully

**Usage:**
```typescript
const { routeData, isLoading, error } = useDriverRoute({
  origin: { latitude: 32.7767, longitude: -96.7970 },
  destination: { latitude: 29.7604, longitude: -95.3698 },
  enabled: true
});
```

**Returns:**
```typescript
{
  routeCoords: RouteCoordinate[],  // Array of lat/lng pairs for polyline
  distanceKm: number,               // Total distance in kilometers
  distanceMiles: number,            // Total distance in miles
  durationMin: number,              // ETA in minutes
  durationFormatted: string         // ETA formatted as "2 h 14 m"
}
```

### 2. Driver Data Structure
Updated `CommandCenterDriver` interface to include route locations:

```typescript
interface CommandCenterDriver {
  id: string;
  driverId: string;
  name: string;
  status: DriverStatus;
  location: { latitude: number; longitude: number };
  currentLoad?: string;
  lastUpdate: Date;
  pickupLocation?: { latitude: number; longitude: number };  // NEW
  dropoffLocation?: { latitude: number; longitude: number }; // NEW
}
```

### 3. Command Center Integration
The Command Center now displays ETA badges on driver cards:

**Driver Card Features:**
- Shows driver name, ID, and status
- Displays current load ID
- **NEW:** Shows ETA and distance remaining when route data is available
- Format: "ETA: 2 h 14 m • 185 mi"
- Updates every 30 seconds

**Visual Design:**
- ETA badge appears below driver status
- Uses Route icon from lucide-react-native
- Deep blue color (#1E3A8A) matching LoadRush theme
- Separated by border for visual clarity

### 4. Data Flow

```
Driver App (GPS) → Firestore
    ↓
    location: { lat, lng }
    pickupLocation: { lat, lng }
    dropoffLocation: { lat, lng }
    ↓
Command Center (useCommandCenterDrivers)
    ↓
Driver Card (useDriverRoute)
    ↓
Mapbox Directions API
    ↓
Route Data (coords, distance, ETA)
    ↓
Display on UI
```

### 5. Mapbox API Configuration

**Environment Variable:**
```
EXPO_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

**API Endpoint:**
```
https://api.mapbox.com/directions/v5/mapbox/driving/{originLng},{originLat};{destLng},{destLat}?geometries=geojson&access_token={token}
```

**Response Format:**
```json
{
  "routes": [{
    "geometry": {
      "coordinates": [[lng, lat], [lng, lat], ...]
    },
    "distance": 296000,  // meters
    "duration": 8040     // seconds
  }]
}
```

### 6. Mock Data
Mock drivers include sample pickup and dropoff locations:

```typescript
{
  id: 'mock-1',
  driverId: 'DRV-001',
  name: 'Jake Miller',
  status: 'in-transit',
  location: { latitude: 32.7767, longitude: -96.7970 },  // Dallas, TX
  pickupLocation: { latitude: 32.7767, longitude: -96.7970 },
  dropoffLocation: { latitude: 29.7604, longitude: -95.3698 },  // Houston, TX
  currentLoad: 'LOAD-12345'
}
```

## Features

### Real-Time Updates
- Route data refreshes every 30 seconds
- Debounced to prevent excessive API calls
- Updates automatically when driver location changes

### Performance Optimization
- Only fetches routes for drivers with valid pickup/dropoff locations
- Caches last fetch time to prevent duplicate requests
- Cleans up intervals on component unmount

### Error Handling
- Gracefully handles missing Mapbox token
- Displays error messages in console
- Continues to show driver without ETA if route fetch fails

### Responsive Design
- ETA badge adapts to card width
- Maintains LoadRush color scheme
- Smooth transitions when data updates

## Future Enhancements

### Phase 2: Route Polylines on Map
- Draw color-coded route lines on Mapbox map
- Match line color to driver status:
  - 🟢 Green: Pickup
  - 🟡 Yellow: In Transit
  - 🟣 Purple: Accomplished
  - 🔴 Red: Breakdown

### Phase 3: Live Progress Tracking
- Calculate percentage of route completed
- Show progress bar on driver card
- Update ETA based on actual speed vs expected

### Phase 4: Traffic Integration
- Use Mapbox Traffic API for real-time traffic data
- Adjust ETA based on current traffic conditions
- Alert admins of significant delays

## Testing

### Manual Testing
1. Open Command Center
2. Verify drivers with pickup/dropoff locations show ETA badges
3. Wait 30 seconds and verify ETA updates
4. Check console for route fetch logs

### Console Logs
```
[useDriverRoute] Fetching route from Mapbox Directions API
[useDriverRoute] Route fetched successfully: { distance: "185.2 mi", duration: "2 h 14 m", points: 142 }
```

## Troubleshooting

### ETA Not Showing
- Check if driver has both `pickupLocation` and `dropoffLocation`
- Verify `EXPO_PUBLIC_MAPBOX_TOKEN` is set
- Check console for API errors

### Incorrect ETA
- Verify coordinates are in correct format (latitude, longitude)
- Check Mapbox API response in network tab
- Ensure coordinates are valid U.S. locations

### Performance Issues
- Reduce `UPDATE_INTERVAL` if too frequent
- Increase debounce threshold
- Limit number of simultaneous route requests

## Dependencies
- `expo-router`: Navigation
- `lucide-react-native`: Icons
- `firebase/firestore`: Real-time data
- Mapbox Directions API: Route calculation

## Files Modified
- `hooks/useDriverRoute.ts` (NEW)
- `hooks/useCommandCenterDrivers.ts` (UPDATED)
- `app/(admin)/command-center.tsx` (UPDATED)
- `app/(driver)/dashboard.tsx` (UPDATED)

## API Costs
- Mapbox Directions API: Free tier includes 100,000 requests/month
- Current implementation: ~2 requests/minute per active driver
- Estimated monthly usage: ~86,400 requests per driver
- Supports ~1 active driver on free tier
