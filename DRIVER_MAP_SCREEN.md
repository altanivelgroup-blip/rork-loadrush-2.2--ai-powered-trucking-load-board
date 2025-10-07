# Driver Map Screen with ORS Routing

## Overview
The Driver Map Screen provides live GPS tracking with OpenRouteService (ORS) routing integration. It displays the driver's current location, pickup/dropoff markers, and the calculated route between them.

## Features
- ✅ Live GPS tracking using `useDriverGPS` hook
- ✅ OpenRouteService API integration for route calculation
- ✅ Visual route display with polyline
- ✅ Distance and ETA calculations (miles and minutes)
- ✅ Pickup (green) and Drop-off (red) markers
- ✅ Web fallback with user-friendly message
- ✅ Error handling for GPS and routing failures
- ✅ LoadRush branded UI with gradient header

## Usage

### Navigation
Navigate to the map screen from any driver screen using:

```typescript
import { useRouter } from 'expo-router';

const router = useRouter();

router.push({
  pathname: '/(driver)/map-screen',
  params: {
    pickupLat: '32.7767',
    pickupLng: '-96.7970',
    dropoffLat: '29.7604',
    dropoffLng: '-95.3698',
  },
});
```

### Route Parameters
- `pickupLat` (string): Pickup location latitude
- `pickupLng` (string): Pickup location longitude
- `dropoffLat` (string): Dropoff location latitude
- `dropoffLng` (string): Dropoff location longitude

## OpenRouteService API

### API Key Configuration
Set your ORS API key in your environment:
```bash
EXPO_PUBLIC_ORS_API_KEY=your_api_key_here
```

The app includes a fallback demo key, but you should use your own for production.

### Get Your Free API Key
1. Visit https://openrouteservice.org/
2. Sign up for a free account
3. Navigate to Dashboard → API Keys
4. Create a new key
5. Add to your `.env` file

### API Endpoint
```
https://api.openrouteservice.org/v2/directions/driving-car
```

### Request Format
```
?api_key={YOUR_KEY}&start={lng},{lat}&end={lng},{lat}
```

### Response Format
The API returns GeoJSON with:
- `features[0].geometry.coordinates`: Array of [lng, lat] points
- `features[0].properties.summary.distance`: Distance in meters
- `features[0].properties.summary.duration`: Duration in seconds

## Components Used

### Map Components
- `MapView`: React Native Maps view (native only)
- `Marker`: Map markers for pickup/dropoff
- `Polyline`: Route visualization
- Platform-specific imports via `@/components/MapComponents`

### Hooks
- `useDriverGPS`: Live GPS tracking with Firestore sync
- `useAuth`: User authentication context
- `useLocalSearchParams`: Route parameters
- `useRouter`: Navigation

## UI Features

### Header
- LoadRush blue gradient background
- "Live Map" title
- "Pickup → Drop-off" subtitle
- Close button (X icon)

### Info Box
- Distance display (miles)
- ETA display (minutes)
- "updated live" indicator
- Loading state during route calculation
- Error display if route fails

### Map Features
- User location tracking
- Follow user location mode
- Green marker for pickup
- Red marker for drop-off
- Blue polyline for route
- Initial region centered on driver

## Platform Support

### Mobile (iOS/Android)
- ✅ Full map functionality
- ✅ Live GPS tracking
- ✅ Route visualization
- ✅ All features enabled

### Web
- ⚠️ Shows fallback message
- ⚠️ Maps not available (react-native-maps limitation)
- ✅ Graceful degradation
- ✅ User-friendly error message

## Error Handling

### GPS Errors
- Permission denied
- Location unavailable
- Displays error message with close button

### Route Errors
- API failures
- No route found
- Network errors
- Displays error in info box with retry option

### Loading States
- "Locating driver..." during GPS initialization
- "Calculating route..." during API call
- Activity indicators for visual feedback

## Styling

### Colors
- Primary: LoadRush blue (#2563EB)
- Header: Blue gradient with transparency
- Info box: White with shadow
- Text: High contrast for readability

### Layout
- Full-screen map
- Absolute positioned header (top)
- Absolute positioned info box (bottom)
- Safe area insets respected

## Performance

### Optimizations
- `useMemo` for pickup/dropoff coordinates
- `useCallback` for route fetching
- Proper dependency arrays
- Minimal re-renders

### API Calls
- Only fetches route when location and destinations change
- Debounced by React hooks
- Error recovery without infinite loops

## Future Enhancements
- [ ] Turn-by-turn navigation instructions
- [ ] Real-time traffic updates
- [ ] Alternative route suggestions
- [ ] Waypoint support for multi-stop routes
- [ ] Offline map caching
- [ ] Route replay/history
- [ ] Speed and heading indicators

## Related Files
- `/app/(driver)/map-screen.tsx` - Main screen component
- `/hooks/useDriverGPS.ts` - GPS tracking hook
- `/components/MapComponents.tsx` - Platform-specific map exports
- `/app/(driver)/navigation-screen.tsx` - Advanced navigation with turn-by-turn

## Differences from Navigation Screen

### Map Screen (Simple)
- Basic route visualization
- Distance and ETA only
- No turn-by-turn guidance
- No trip completion tracking
- Simpler UI

### Navigation Screen (Advanced)
- Full navigation experience
- Start/stop navigation controls
- Trip completion detection
- Celebration animation
- More complex state management

Choose the appropriate screen based on your use case:
- Use **map-screen** for quick route preview
- Use **navigation-screen** for active trip guidance
