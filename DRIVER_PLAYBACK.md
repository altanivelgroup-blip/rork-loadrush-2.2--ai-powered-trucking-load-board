# Driver Playback Timeline Integration

## Overview
The Driver Playback Timeline feature enables historical route playback in the LoadRush Command Center. Admins can replay any driver's trip with adjustable speed controls, viewing their movement along recorded GPS paths with animated trail effects.

## Architecture

### Hook: `useDriverPlayback`
**Location:** `hooks/useDriverPlayback.ts`

**Purpose:** Manages playback state and animation logic for historical driver routes.

**Parameters:**
```typescript
{
  driverId: string | null;
  locations: PlaybackLocation[];  // Array of {latitude, longitude, timestamp}
  speed?: number;                 // Playback speed multiplier (default: 1)
  autoPlay?: boolean;             // Auto-start playback (default: false)
}
```

**Returns:**
```typescript
{
  play: () => void;               // Start playback
  pause: () => void;              // Pause playback
  restart: () => void;            // Reset to beginning
  setSpeed: (speed: number) => void;  // Change playback speed
  isPlaying: boolean;             // Current playback state
  currentIndex: number;           // Current location index
  progress: number;               // Completion percentage (0-100)
  currentLocation: PlaybackLocation | null;  // Current position
}
```

**Features:**
- 60 FPS animation using `requestAnimationFrame`
- Smooth interpolation between GPS coordinates
- Speed control (1×, 2×, 4×)
- Progress tracking
- Auto-cleanup on unmount

## UI Components

### Playback Toolbar
**Location:** `app/(admin)/command-center.tsx` (PlaybackToolbar component)

**Features:**
- Driver selection dropdown
- Progress bar with percentage display
- Play/Pause button
- Restart button
- Speed cycle button (1× → 2× → 4×)
- Close button

**Styling:**
- Glassmorphism dark panel
- Bottom-center positioning
- Animated slide-in/out
- LoadRush blue accent colors

### Ghost Marker
**Location:** `app/(admin)/command-center.tsx` (PlaybackGhostMarker component)

**Features:**
- Animated pulsing marker
- Glowing trail effect
- Status-based color coding
- Smooth position updates

**Visual Effects:**
- Dual animation loops (pulse + glow)
- Opacity fading for trail
- Status color inheritance

## Integration with Command Center

### Activation
1. Click "Playback" toggle in header
2. Projector Mode and filters automatically hide
3. Map enters fullscreen mode
4. Playback toolbar slides in from bottom

### Driver Selection
- Only drivers with `locationHistory` appear in dropdown
- Mock data provided for testing (2 drivers with routes)
- Selection triggers automatic restart

### Playback Controls
- **Play/Pause:** Toggle playback state
- **Restart:** Reset to first location
- **Speed:** Cycle through 1×, 2×, 4× speeds
- **Progress Bar:** Visual feedback of completion

### Map Behavior
- Regular driver markers hidden during playback
- Ghost marker follows historical path
- Marker color matches driver status
- Smooth animation at 60 FPS

## Data Structure

### Mock Location History
```typescript
{
  'mock-1': [
    { latitude: 32.7767, longitude: -96.7970, timestamp: Date.now() - 3600000 },
    { latitude: 32.5, longitude: -96.5, timestamp: Date.now() - 3000000 },
    // ... 7 total points (Dallas → Houston route)
  ],
  'mock-2': [
    { latitude: 29.7604, longitude: -95.3698, timestamp: Date.now() - 7200000 },
    { latitude: 30.5, longitude: -98.0, timestamp: Date.now() - 6000000 },
    // ... 7 total points (Houston → LA route)
  ]
}
```

### Firestore Schema (Future)
```typescript
drivers/{driverId}/locationHistory (subcollection)
{
  latitude: number;
  longitude: number;
  timestamp: Timestamp;
  speed?: number;
  heading?: number;
}
```

## Performance Considerations

### Animation Optimization
- Uses `requestAnimationFrame` for smooth 60 FPS
- Throttles updates to prevent excessive renders
- Cleans up animation loops on unmount
- Pauses when component unmounts

### Memory Management
- Limits location history to reasonable size
- Cleans up event listeners
- Stops animations when not visible

## Future Enhancements

### Phase 2 Features
1. **Trail Visualization**
   - Fading polyline behind ghost marker
   - Gradient opacity based on time
   - Status color for trail segments

2. **Timeline Scrubbing**
   - Draggable progress bar
   - Jump to specific timestamp
   - Hover preview

3. **Multi-Driver Playback**
   - Simultaneous playback of multiple drivers
   - Synchronized timeline
   - Comparison mode

4. **Export & Sharing**
   - Export playback as video
   - Share specific trip segments
   - Generate trip reports

### Firestore Integration
1. Store location history in subcollection
2. Query by date range
3. Implement pagination for long trips
4. Add metadata (speed, heading, events)

## Usage Example

```typescript
// In Command Center
const playback = useDriverPlayback({
  driverId: selectedPlaybackDriver,
  locations: playbackLocations,
  speed: playbackSpeed,
  autoPlay: false,
});

// Control playback
<TouchableOpacity onPress={playback.play}>
  <Play />
</TouchableOpacity>

// Display progress
<Text>{playback.progress.toFixed(1)}% Complete</Text>

// Render ghost marker
{playback.currentLocation && (
  <PlaybackGhostMarker
    driver={selectedDriver}
    location={playback.currentLocation}
    progress={playback.progress}
  />
)}
```

## Testing

### Manual Testing
1. Open Command Center
2. Click "Playback" toggle
3. Select "Jake Miller" or "Sarah Lopez"
4. Click Play button
5. Observe smooth marker movement
6. Test speed controls (1×, 2×, 4×)
7. Test restart functionality
8. Verify progress bar updates

### Expected Behavior
- Marker moves smoothly along route
- Progress bar fills from 0% to 100%
- Speed changes affect animation rate
- Restart returns to beginning
- Close button exits playback mode

## Troubleshooting

### Marker Not Moving
- Check if locations array is populated
- Verify playback.isPlaying is true
- Check console for animation errors

### Jerky Animation
- Ensure requestAnimationFrame is working
- Check for performance bottlenecks
- Verify 60 FPS target is met

### Progress Not Updating
- Check currentIndex increments
- Verify progress calculation
- Ensure locations array has length > 0

## Related Files
- `hooks/useDriverPlayback.ts` - Playback logic
- `app/(admin)/command-center.tsx` - UI integration
- `hooks/useCommandCenterDrivers.ts` - Driver data
- `hooks/useDriverRoute.ts` - Route calculations
- `hooks/useDriverGPS.ts` - Live GPS tracking

## Status
✅ **Implemented** - Phase 1 complete with core playback functionality
🔄 **In Progress** - Mock data integration
📋 **Planned** - Firestore integration, trail visualization, multi-driver playback
