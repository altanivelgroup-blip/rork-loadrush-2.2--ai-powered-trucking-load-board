# 🚀 QUICK FIX: Restore All LoadRush Test Data

## ⚡ Run This Command NOW

```bash
chmod +x scripts/run-seed-loadrush.sh && ./scripts/run-seed-loadrush.sh
```

## ✅ What This Does

1. **Clears** all existing loads from Firestore
2. **Creates** 23 new test loads with proper structure
3. **Makes visible** across your entire platform:
   - ✅ Driver app will show 12 available loads
   - ✅ Shipper dashboard will show all 23 loads
   - ✅ Admin Command Center will track everything

## 📊 What You'll Get

### 🟢 Available Loads (12)
- Visible in Driver app "Loads" tab
- Routes from California to Texas, Arizona, New Mexico
- Various vehicle types and rates

### 🟡 In-Transit Loads (7)
- Assigned to drivers
- Tracked in Shipper dashboard
- Shows driver names and phone numbers

### 🟣 Completed Loads (4)
- Delivery history
- Shows in completed section

## 🔍 How to Verify

### 1. Driver App
```
Sign in: driver@loadrush.com
Go to: Loads tab
Should see: 12 available loads
```

### 2. Shipper Dashboard
```
Sign in: shipper@loadrush.com
Go to: Loads tab
Should see: 23 total loads
Filter by: All (23), Active (7), Delivered (4)
```

### 3. Admin Command Center
```
Long-press: LoadRush logo
Go to: Admin → Loads
Should see: All 23 loads with filters
```

## 🎯 Test Accounts

- **Shipper**: shipper@loadrush.com
- **Driver**: driver@loadrush.com
- **Admin**: Long-press logo on any screen

## ⚠️ Important Notes

- This script **DELETES** all existing loads first
- All loads are assigned to shipper ID: `K6JAh3s9jzdB0Usj2dkw4bmXdUk1`
- Loads expire after 30 days
- Safe to run multiple times

## 🐛 If Something Goes Wrong

Check console for errors:
- Firebase connection issues
- Permission errors
- Firestore rules blocking writes

## 📖 More Details

See `LOADRUSH_DATA_RESTORE.md` for complete documentation.

---

**Just run the command above and your loads will be restored! 🎉**
