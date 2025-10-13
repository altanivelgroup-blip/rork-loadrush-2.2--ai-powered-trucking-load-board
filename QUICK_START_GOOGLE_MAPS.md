# 🚀 Quick Start: Google Maps Command Center

## Get Your API Key (5 minutes)

### 1. Go to Google Cloud Console
👉 **[Click here to open Google Cloud Console](https://console.cloud.google.com/)**

### 2. Create/Select Project
- Click project dropdown at top
- Click "New Project" or select existing
- Name it "LoadRush" (or anything)

### 3. Enable Maps JavaScript API
- Click hamburger menu (☰) → **APIs & Services** → **Library**
- Search: "Maps JavaScript API"
- Click it → Click **ENABLE**

### 4. Create API Key
- Click hamburger menu (☰) → **APIs & Services** → **Credentials**
- Click **+ CREATE CREDENTIALS** → **API Key**
- **Copy the key** (looks like: `AIzaSyC...`)

### 5. Restrict the Key (Important!)
- Click on your new API key to edit
- **Application restrictions**: Select "HTTP referrers"
- Click **+ ADD AN ITEM** and add these (one per line):
  ```
  http://localhost:8081/*
  http://localhost:8080/*
  https://*.expo.dev/*
  https://*.rorktest.dev/*
  ```
- **API restrictions**: Select "Restrict key"
- Check only: **Maps JavaScript API**
- Click **SAVE**

### 6. Add to .env File
Open your `.env` file and paste your key:
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyC_YOUR_KEY_HERE
```

### 7. Restart Server
```bash
# Stop server (Ctrl+C or Cmd+C)
# Then restart:
bun start
```

## ✅ Test It Works

### On Desktop Browser
1. Open Command Center
2. Toggle to **Map** view
3. You should see:
   - ✅ Google Maps loads with dark theme
   - ✅ Driver markers with blinking lights
   - ✅ Zoom controls (bottom right): USA, +, -
   - ✅ Smooth scroll wheel zoom

### On iPad
1. Open Command Center on iPad
2. Toggle to **Map** view
3. Test these:
   - ✅ **Pinch zoom** - Should be smooth, no sticking
   - ✅ **Pan/drag** - Move around map
   - ✅ **Tap markers** - See driver popup
   - ✅ **Tap USA button** - Reset to full USA view

### Test Demo Mode
1. Toggle **Demo Mode** switch ON
2. Watch drivers animate across the map
3. Markers should move smoothly with blinking lights

## 🚨 Troubleshooting

### "Map failed to load"
**Problem**: API key not set or invalid
**Fix**: 
1. Check `.env` has `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...`
2. Restart server after adding key
3. Clear browser cache

### "RefererNotAllowedMapError"
**Problem**: Your domain not in API key restrictions
**Fix**:
1. Go to Google Cloud Console → Credentials
2. Edit your API key
3. Add your current URL to HTTP referrers
   - Example: `https://dev-abc123.rorktest.dev/*`
4. Save and refresh browser

### Map loads but zoom doesn't work
**Problem**: Might be on native app (not web)
**Fix**: 
- Ensure you're testing on web browser or iPad web view
- Native apps use different map system (react-native-maps)

### No drivers showing
**Problem**: No drivers in Firebase
**Fix**:
1. Check Firebase Console → Firestore → `drivers` collection
2. Or run seed script: `bun run scripts/seed-command-center-v4.ts`

## 🎯 What You Get

### Smooth Zoom
- **Pinch zoom**: Fluid on iPad, no sticking
- **Scroll wheel**: Smooth accumulator-based zoom
- **Buttons**: +/- for precise control
- **USA reset**: One tap to see full country

### Bounds & Limits
- **Min zoom**: Can't zoom out past USA view
- **Max zoom**: Street-level detail (zoom 18)
- **USA bounds**: Can't pan outside USA
- **Auto-fit**: Resizes to show all drivers

### All Features Preserved
- ✅ Real-time driver tracking
- ✅ Blinking status lights (pickup, in transit, etc.)
- ✅ Demo Mode animations
- ✅ Dark/Map view toggle
- ✅ Projector Mode
- ✅ Status filters
- ✅ Driver popups with ETA/distance
- ✅ Sidebar collapse
- ✅ Quick access sign-in

## 💡 Pro Tips

### Free Tier
- Google gives $200/month free credit
- Command Center uses ~1 map load per session
- You'll likely stay in free tier

### Security
- Always restrict API keys to HTTP referrers
- Never commit API keys to public repos
- Monitor usage in Google Cloud Console

### Performance
- Map loads once and caches
- Markers update in real-time via Firebase
- Smooth 60fps animations

## 📱 iPad-Specific Features

### Optimized Touch
- Large touch targets for zoom buttons
- Gesture handling set to "greedy" for smooth interactions
- No accidental zooms when scrolling page

### Responsive Design
- Sidebar collapses on smaller screens
- Zoom controls positioned for thumb access
- Full-screen map in Projector Mode

## 🎉 Success!

If you see:
- ✅ Map loads with dark theme
- ✅ Driver markers with pulsing lights
- ✅ Smooth zoom in/out
- ✅ Demo Mode works

**You're all set!** The Command Center is now using Google Maps JavaScript API with optimized zoom controls.

---

**Need more help?** See full guide: `GOOGLE_MAPS_SETUP_GUIDE.md`
