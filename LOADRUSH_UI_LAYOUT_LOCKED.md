# LoadRush UI Layout Configuration - LOCKED
**Version:** v1.0  
**Date:** 2025-10-08  
**Status:** FROZEN - Do not auto-adjust during updates

---

## 🔒 LAYOUT LOCK POLICY

This document defines the **permanent** UI layout configuration for LoadRush across all roles.

**Rules:**
- ✅ Manual edits and new page additions are allowed when explicitly requested
- ❌ No automatic layout adjustments during updates, regenerations, or rebuilds
- ❌ No inheritance or bleeding between role layouts
- ❌ No auto-synchronization from other role groups

---

## 📱 SHIPPER LAYOUT (Locked)

### Tab Configuration
**File:** `app/(shipper)/_layout.tsx`

**Bottom Tabs (5 tabs):**
1. Dashboard
2. My Loads
3. Post Loads
4. Analytics
5. Profile

### Header Configuration
```typescript
headerShown: true
headerTransparent: false
headerTitle: ''
headerTitleStyle: { display: 'none' }
headerStyle: {
  backgroundColor: '#FFFFFF',
  height: 100,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  elevation: 0,
  shadowOpacity: 0,
}
```

### Custom Header Component
```typescript
paddingTop: insets.top + 8
paddingHorizontal: 16
paddingBottom: 8
```

**Header Title:**
- fontSize: 20
- fontWeight: '700'
- color: '#0A0A0A'
- marginBottom: 2

**Header Tagline:**
- fontSize: 14
- fontWeight: '400'
- color: '#6B7280'
- marginTop: 2

### Tab Bar Configuration
```typescript
tabBarStyle: {
  backgroundColor: Colors.light.cardBackground,
  borderTopColor: Colors.light.border,
  height: 60 + insets.bottom,
  paddingBottom: insets.bottom > 0 ? insets.bottom - 2 : 6,
}
tabBarActiveTintColor: Colors.light.primary
```

### Hidden Routes (href: null)
- post-single-load
- bulk-upload
- load-templates
- secure-docs-shipper
- settings
- ai-tools
- increase-revenue
- advanced-security
- membership

---

## 🚚 DRIVER LAYOUT (Locked)

### Tab Configuration
**File:** `app/(driver)/_layout.tsx`

**Bottom Tabs (3 tabs):**
1. Dashboard
2. Loads
3. Profile

### Header Configuration
```typescript
headerShown: true
headerTransparent: false
headerTitle: () => null
headerStyle: {
  backgroundColor: '#FFFFFF',
  height: 90,
  borderBottomWidth: 1,
  borderBottomColor: '#E5E7EB',
  elevation: 0,
  shadowOpacity: 0,
}
```

### Custom Header Component
```typescript
paddingTop: insets.top + 4
paddingHorizontal: 16
paddingBottom: 10
```

**Badge:**
- backgroundColor: '#10B981'
- paddingHorizontal: 10
- paddingVertical: 4
- borderRadius: 12
- Text: 'DRIVER'
- fontSize: 11
- fontWeight: '700'
- letterSpacing: 0.5

**Header Title:**
- fontSize: 18
- fontWeight: '600'
- color: '#0A0A0A'

**Header Subtitle:**
- fontSize: 13
- color: '#6B7280'
- marginLeft: 2

**Header Tagline:**
- fontSize: 15
- fontWeight: '400'
- color: '#6B7280'
- marginTop: 4
- marginLeft: 2

### Tab Bar Configuration
```typescript
tabBarStyle: {
  backgroundColor: Colors.light.cardBackground,
  borderTopColor: Colors.light.border,
  height: 60 + insets.bottom,
  paddingBottom: insets.bottom > 0 ? insets.bottom - 2 : 6,
}
tabBarActiveTintColor: Colors.light.primary
```

### Hidden Routes (href: null)
- service-finder
- settings
- maintenance
- wallet
- edit-profile
- analytics
- add-vehicle
- notifications
- membership
- documents
- privacy
- payment-methods
- terms-of-service
- how-we-use-data
- help-support
- load-details
- ai-tools
- increase-revenue
- advanced-security
- navigation-screen
- map-screen

---

## 👔 ADMIN LAYOUT (Locked)

### Tab Configuration
**File:** `app/(admin)/_layout.tsx`

**Bottom Tabs (6 tabs):**
1. Dashboard
2. Loads
3. Documents
4. Analytics
5. Command
6. Profile (labeled as "Profile", name is "settings")

### Header Configuration
```typescript
headerShown: false
```

### Tab Bar Configuration
```typescript
tabBarStyle: {
  backgroundColor: Colors.light.cardBackground,
  borderTopColor: Colors.light.border,
}
tabBarActiveTintColor: Colors.light.primary
```

### Hidden Routes (href: null)
- route
- delay
- trip-archive

---

## 🎨 GLOBAL STYLES

### Safe Area Insets
- **Top padding:** `insets.top + [role-specific offset]`
  - Shipper: +8
  - Driver: +4
  - Admin: N/A (headerShown: false)
- **Bottom padding:** `insets.bottom > 0 ? insets.bottom - 2 : 6`

### Tab Bar Height
```typescript
height: 60 + insets.bottom
```

### Header Heights
- Shipper: 100
- Driver: 90
- Admin: N/A

### Border Styling
```typescript
borderBottomWidth: 1
borderBottomColor: '#E5E7EB'
borderTopColor: Colors.light.border
```

### Background Colors
- Header: '#FFFFFF'
- Tab Bar: Colors.light.cardBackground

---

## 🚫 FORBIDDEN CHANGES

The following changes are **NOT ALLOWED** without explicit user request:

1. ❌ Changing header heights (100 for Shipper, 90 for Driver)
2. ❌ Modifying tab bar height formula (60 + insets.bottom)
3. ❌ Adjusting safe area inset calculations
4. ❌ Changing paddingTop offsets (+8 for Shipper, +4 for Driver)
5. ❌ Modifying paddingBottom formula (insets.bottom > 0 ? insets.bottom - 2 : 6)
6. ❌ Adding/removing tabs without explicit request
7. ❌ Changing tab order
8. ❌ Modifying headerTransparent values
9. ❌ Changing border widths or colors
10. ❌ Adjusting font sizes, weights, or colors in headers
11. ❌ Removing or adding role badges (e.g., "DRIVER" badge)
12. ❌ Synchronizing layouts between roles

---

## ✅ ALLOWED CHANGES

The following changes ARE ALLOWED when explicitly requested:

1. ✅ Adding new hidden routes (href: null)
2. ✅ Creating new pages within existing role folders
3. ✅ Modifying page content (not layout structure)
4. ✅ Adding new features to existing pages
5. ✅ Updating business logic and data handling
6. ✅ Manual adjustments when user provides specific values

---

## 📋 MAINTENANCE CHECKLIST

Before making ANY layout changes, verify:

- [ ] User explicitly requested the change
- [ ] Change does not affect locked layout values
- [ ] Change is isolated to the specific role requested
- [ ] No cross-role inheritance or bleeding
- [ ] Safe area calculations remain intact
- [ ] Tab bar height formula unchanged
- [ ] Header configuration preserved

---

## 🔧 TROUBLESHOOTING

### If "(SHIPPER)" or "(DRIVER)" text appears in headers:
- Check CustomHeader component in `_layout.tsx`
- Ensure no role text is hardcoded in header titles
- Verify headerTitle is set to empty string or null

### If padding looks wrong:
- Verify safe area inset calculations match this document
- Check that paddingTop uses correct offset (+8 or +4)
- Ensure paddingBottom formula is unchanged

### If tabs are missing or wrong:
- Compare tab configuration with this document
- Verify tab order matches locked configuration
- Check that hidden routes have `href: null`

---

**END OF LOCKED CONFIGURATION**

*This document serves as the single source of truth for LoadRush UI layout. Any deviations must be explicitly approved and documented.*
