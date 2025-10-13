# 🗺️ Google Maps Command Center - Quick Reference

## 🎉 What's New

Your LoadRush Command Center now uses **Google Maps JavaScript API** with:
- ✅ **Smooth zoom** (no sticking on iPad!)
- ✅ **Zoom controls**: USA, +, - buttons
- ✅ **USA bounds** restriction
- ✅ **All features preserved**

## 🚀 5-Minute Setup

### 1. Get API Key
[Google Cloud Console](https://console.cloud.google.com/) → Enable "Maps JavaScript API" → Create API key → Restrict to HTTP referrers

### 2. Add to .env
```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

### 3. Restart
```bash
bun start
```

### 4. Test
Open Command Center → Toggle "Map" view → Test zoom

## 📚 Full Documentation

👉 **Start here**: [START_HERE_GOOGLE_MAPS.md](START_HERE_GOOGLE_MAPS.md)

📖 **All docs**: [GOOGLE_MAPS_INDEX.md](GOOGLE_MAPS_INDEX.md)

## 🎯 Key Features

- **Zoom Controls** (bottom right): USA, +, -
- **Smooth Zoom**: Pinch (iPad), scroll wheel (desktop)
- **Real-Time Tracking**: Pulsing driver markers
- **Demo Mode**: 30-45 sec animations
- **All Features**: Filters, popups, projector mode, etc.

## 🚨 Troubleshooting

**Map not loading?**
- Check `.env` has API key
- Restart server
- Clear browser cache

**Referrer error?**
- Add domain to API key restrictions

**Zoom not working?**
- Ensure on web/iPad (not native)
- Try +/- buttons

## ✅ Success Checklist

- [ ] API key created & restricted
- [ ] Added to .env
- [ ] Server restarted
- [ ] Map loads
- [ ] Zoom works smoothly
- [ ] iPad pinch zoom works

## 🎊 You're Ready!

Open [START_HERE_GOOGLE_MAPS.md](START_HERE_GOOGLE_MAPS.md) for complete setup guide.
