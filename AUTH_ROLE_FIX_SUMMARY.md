# Authentication Role Detection Fix

## Problem
Users signing in with shipper email were being logged in as drivers, and couldn't return to the sign-in page.

## Root Cause
1. **No Firestore role lookup**: The auth system only checked localStorage for user roles
2. **Default to 'driver'**: When no role was found in localStorage, it defaulted to 'driver'
3. **Sign-out buttons existed** but users didn't know where to find them

## Solution Implemented

### 1. Firestore Role Detection
Updated `contexts/AuthContext.tsx` to check Firestore collections in this order:
1. Check `drivers/{uid}` collection
2. Check `shippers/{uid}` collection  
3. Check `admins/{uid}` collection
4. Fall back to localStorage `user_role_{uid}`
5. Default to 'driver' only if nothing found

### 2. Applied to Both Auth Flows
- **onAuthStateChanged**: Detects role on app load/refresh
- **signIn**: Detects role during email/password sign-in

### 3. Sign-Out Access Points
Users can sign out from:
- **Driver Dashboard**: Top-right logout button (line 132)
- **Driver Profile**: Bottom of menu list (line 304)
- **Shipper Dashboard**: Similar logout button
- **Admin Dashboard**: Similar logout button

## How It Works Now

```typescript
// Sign in flow:
1. User enters email/password
2. Firebase authenticates
3. System checks Firestore:
   - drivers/{uid} → role = 'driver'
   - shippers/{uid} → role = 'shipper'
   - admins/{uid} → role = 'admin'
4. Role saved to localStorage for faster future lookups
5. User redirected to correct dashboard
```

## Testing

### Test Shipper Login
1. Sign in with shipper email
2. Should see shipper dashboard (not driver)
3. Console should show: `✅ Found shipper profile in Firestore`

### Test Driver Login
1. Sign in with driver email
2. Should see driver dashboard
3. Console should show: `✅ Found driver profile in Firestore`

### Test Sign Out
1. From any dashboard, tap logout button
2. Should return to auth screen
3. Can sign in again with different role

## Console Logs to Watch

```
✅ Found driver profile in Firestore
✅ Found shipper profile in Firestore
✅ Found admin profile in Firestore
⚠️ No Firestore profile found, using stored role: shipper
⚠️ No profile found in Firestore or localStorage, defaulting to driver
✅ Sign in successful as: shipper
```

## Files Modified
- `contexts/AuthContext.tsx` - Added Firestore role detection to both auth flows

## No Changes Needed
- Sign-out buttons already exist in all dashboards
- Navigation logic already handles role-based routing
- Firestore security rules already allow reading user profiles
