# Google Maps JavaScript API Setup Guide

## Overview
The Command Center now uses **Google Maps JavaScript API** for web/iPad with smooth zoom controls, USA bounds restriction, and all existing features preserved.

## ✅ What's Fixed
- **Smooth Zoom**: Pinch-to-zoom works fluidly without sticking
- **Zoom Controls**: +/- buttons and "USA" reset button
- **Bounds Restriction**: Map stays within USA boundaries
- **Min/Max Zoom**: Prevents over-zooming in/out
- **Wheel Zoom**: Smooth scroll wheel zoom with accumulator
- **All Features Preserved**: Real-time markers, blinking lights, Demo Mode, routes, etc.

## 🔑 Getting Your Google Maps API Key

### Step 1: Create/Access Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Create a new project or select existing one

### Step 2: Enable Maps JavaScript API
1. In the Cloud Console, go to **APIs & Services** > **Library**
2. Search for "Maps JavaScript API"
3. Click on it and press **Enable**

### Step 3: Create API Key
1. Go to **APIs & Services** > **Credentials**
2. Click **+ CREATE CREDENTIALS** > **API Key**
3. Copy the generated API key

### Step 4: Restrict API Key (Important for Security)
1. Click on your newly created API key to edit it
2. Under **Application restrictions**, select **HTTP referrers (web sites)**
3. Add these referrers:
   ```
   http://localhost:8081/*
   http://localhost:8080/*
   https://*.exp.direct/*
   https://*.expo.dev/*
   https://*.rorktest.dev/*
   https://*.ngrok-free.app/*
   ```
4. Under **API restrictions**, select **Restrict key**
5. Check only: **Maps JavaScript API**
6. Click **Save**

### Step 5: Add to Your .env File
```bash
# Add this line to your .env file
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_API_KEY_HERE
```

### Step 6: Restart Your Development Server
```bash
# Stop the server (Ctrl+C) and restart
bun start
```

## 🧪 Testing on iPad

### Test Zoom Functionality
1. Open Command Center on iPad
2. Toggle to "Map" view
3. Test these gestures:
   - **Pinch to zoom in/out** - Should be smooth, no sticking
   - **Double-tap** - Quick zoom in
   - **Two-finger tap** - Quick zoom out
   - **Pan/drag** - Move around the map
   - **Tap +/- buttons** - Zoom controls
   - **Tap "USA" button** - Reset to full USA view

### Verify Features Still Work
- ✅ Real-time driver markers with blinking lights
- ✅ Click markers to see driver popup
- ✅ Demo Mode toggle (animates drivers)
- ✅ Dark/Map view toggle
- ✅ Projector Mode
- ✅ Filter by status (Pickup, In Transit, etc.)
- ✅ Sidebar collapse/expand
- ✅ Quick access sign-in preserved

## 🎯 Key Features

### Zoom Controls (Bottom Right)
- **USA Button**: Resets view to show entire USA
- **+ Button**: Zoom in one level
- **- Button**: Zoom out one level

### Zoom Behavior
- **Min Zoom**: 2 (can't zoom out past USA view)
- **Max Zoom**: 18 (street-level detail)
- **Wheel Zoom**: Smooth accumulator-based zooming
- **Bounds**: Restricted to USA (can't pan to other countries)
- **Gesture Handling**: "greedy" mode for smooth touch interactions

### Map Styling
- Dark theme matching LoadRush design
- Traffic layer enabled
- Minimal UI (no street view, fullscreen, or map type controls)
- Custom pulsing markers for drivers

## 🔧 Technical Details

### Files Modified
1. **components/MapComponents.web.tsx** - Google Maps JS implementation
2. **app/(admin)/command-center.tsx** - No changes needed (uses same API)
3. **.env** - Added EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

### Platform Support
- **Web/iPad**: Google Maps JavaScript API
- **iOS/Android Native**: React Native Maps (unchanged)

### API Usage
- Uses Google Maps JavaScript API v3
- Loads dynamically via script tag
- Includes geometry library for calculations
- Custom overlay for pulsing driver markers

## 🚨 Troubleshooting

### Map Not Loading
**Error**: "RefererNotAllowedMapError"
- **Fix**: Add your domain to API key HTTP referrer restrictions

**Error**: "Map failed to load"
- **Fix**: Check that EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is set in .env
- **Fix**: Verify API key is enabled for Maps JavaScript API

### Zoom Not Working
- **Check**: Ensure you're on web/iPad (not native app)
- **Check**: Try the +/- buttons first to verify zoom is working
- **Check**: Clear browser cache and reload

### Markers Not Showing
- **Check**: Verify drivers exist in Firebase
- **Check**: Check browser console for errors
- **Check**: Ensure map has loaded (wait for "Map Ready" log)

## 💰 Pricing

Google Maps JavaScript API pricing (as of 2024):
- **Free tier**: $200 credit per month
- **Map loads**: $7 per 1,000 loads (after free tier)
- **Typical usage**: Command Center = ~1 load per session
- **Estimated cost**: Free for most use cases

## 📝 Notes

- API key is client-side visible (normal for Maps JS API)
- Use HTTP referrer restrictions to prevent abuse
- Monitor usage in Google Cloud Console
- Consider setting up billing alerts
- Native apps still use react-native-maps (no Google API key needed there)

## ✨ Benefits Over Previous Implementation

1. **Better Zoom Control**: Native Google Maps zoom is smoother than react-native-maps web
2. **iPad Optimized**: Designed for touch gestures
3. **Bounds Restriction**: Built-in USA bounds enforcement
4. **Traffic Layer**: Real-time traffic data
5. **Custom Styling**: Dark theme matches LoadRush design
6. **Performance**: Optimized for web/iPad rendering
7. **Reliability**: Google's infrastructure vs. third-party libraries

## 🎉 Success Checklist

- [ ] Google Maps API key created
- [ ] API key restricted to HTTP referrers
- [ ] Maps JavaScript API enabled
- [ ] API key added to .env file
- [ ] Development server restarted
- [ ] Map loads on web browser
- [ ] Zoom in/out works smoothly
- [ ] Pinch zoom works on iPad
- [ ] Driver markers appear with blinking lights
- [ ] Demo Mode works
- [ ] All filters work
- [ ] Quick access sign-in works

---

**Need Help?** Check the browser console for detailed error messages. The map component provides helpful error messages with setup instructions.
