# Quick Start: LoadRush Test Data

## 🚀 One Command to Rule Them All

```bash
npm run seed-test-data
```

## 📊 What You Get

- **15 Test Drivers** (varied statuses: in_transit, pickup, accomplished, breakdown)
- **15 Test Loads** (varied routes: Dallas→Houston, LA→Phoenix, NYC→Boston, etc.)
- **Full GPS Coordinates** for real-time tracking
- **30-Day Expiration** on all loads
- **Realistic Data** (pricing, distances, cargo types)

## 🔍 Where to View

| Platform | How to Access | What You'll See |
|----------|---------------|-----------------|
| **Driver App** | Sign in as driver → Loads tab | Available loads to accept |
| **Shipper Dashboard** | Sign in as shipper → Loads section | Posted/tracked loads |
| **Admin Command Center** | Long-press logo → Admin → Command Center | All 15 drivers on map with statuses |
| **Admin Loads** | Admin panel → Loads | All loads with filters |

## 📱 Test On

- **iPad/Mobile**: Scan QR code
- **Web**: Current browser
- **Command Center**: Best on larger screens

## ⚠️ Important Notes

- Script **DELETES** existing drivers/loads first
- Safe to re-run multiple times
- Development/staging only (NOT production)
- Respects Firestore security rules

## 🎯 Quick Test Checklist

After seeding, verify:
- [ ] Driver app shows available loads
- [ ] Shipper dashboard shows posted loads
- [ ] Admin Command Center displays all 15 drivers on map
- [ ] Admin Loads shows all 15 loads with filters
- [ ] Status colors are correct (red=breakdown, orange=in_transit, etc.)
- [ ] Load details show correct pickup/dropoff locations
- [ ] GPS coordinates are valid numbers

## 🐛 Troubleshooting

**No data appears?**
- Check console for errors
- Verify Firebase connection
- Ensure correct role sign-in

**Drivers not on map?**
- Check `drivers` collection in Firestore
- Verify `location`, `status`, `name` fields exist

**Loads not in Driver app?**
- Verify `status: "Available"`
- Check `expiresAt` is future date
- Ensure coordinates are numbers

## 📚 Full Documentation

See `TEST_DATA_RESTORATION_GUIDE.md` for complete details.

## 🎉 Ready to Test!

Your LoadRush platform is now fully populated with realistic test data. Start testing across all platforms!
