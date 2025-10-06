# Firebase Data Bindings for LoadRush 2.2

## Overview
This document outlines the data structure and Firebase integration points for live data connection in LoadRush 2.2.

## Load Card Analytics Data Structure

### Firebase Collection Structure
```
/loads/{loadId}
  - id: string
  - shipperId: string
  - shipperName: string
  - status: 'posted' | 'matched' | 'in_transit' | 'delivered' | 'cancelled'
  - rate: number
  - distance: number
  - ratePerMile: number
  - pickup: {
      location: string
      city: string
      state: string
      date: string (ISO 8601)
      time: string (HH:mm)
    }
  - dropoff: {
      location: string
      city: string
      state: string
      date: string (ISO 8601)
      time: string (HH:mm)
    }
  - cargo: {
      type: string
      weight: number
      description: string
      photoUrls?: string[]
    }
  - matchedDriverId?: string
  - matchedDriverName?: string
  - aiScore?: number
  - analytics?: {
      miles: number
      mpg: number
      fuelType: string
      fuelPrice: number
      gallonsNeeded: string
      fuelCost: string
      gross: number
      netProfit: string
      profitPerMile: string
      eta: string
    }
  - createdAt: string (ISO 8601)
  - updatedAt: string (ISO 8601)
```

### Analytics Data Bindings

The `LoadCard` component supports two modes of analytics data:

#### 1. Pre-calculated Analytics (Firebase)
When `load.analytics` is provided from Firebase, it will be used directly:

```typescript
const load = {
  id: "load123",
  rate: 2850,
  distance: 1050,
  analytics: {
    miles: 1050,
    mpg: 7.2,
    fuelType: "Diesel",
    fuelPrice: 3.85,
    gallonsNeeded: "145.8",
    fuelCost: "561",
    gross: 2850,
    netProfit: "2289",
    profitPerMile: "2.18",
    eta: "Fri 3:45 PM"
  }
}
```

#### 2. Client-side Calculation (Fallback)
If `load.analytics` is not provided, the component calculates analytics using:
- Driver profile MPG from `user.profile.truckInfo.mpg`
- Load distance from `load.distance`
- Load rate from `load.rate`
- Current fuel price (default: $3.85/gallon)

### Data Binding Points

#### Required Fields (Always Display)
- `load.id` - Unique load identifier
- `load.status` - Current load status
- `load.rate` - Payment rate (fallback: 0)
- `load.pickup.city` - Pickup city (fallback: 'N/A')
- `load.pickup.state` - Pickup state (fallback: 'N/A')
- `load.dropoff.city` - Dropoff city (fallback: 'N/A')
- `load.dropoff.state` - Dropoff state (fallback: 'N/A')

#### Optional Fields (Conditional Display)
- `load.aiScore` - AI matching score (0-100)
- `load.available` - Shows "Available" pill
- `load.rushDelivery` - Shows "Rush Delivery" pill
- `load.analytics` - Pre-calculated analytics data

#### Analytics Fields (Displayed when available)
- `analytics.fuelCost` - Estimated fuel cost
- `analytics.netProfit` - Net profit after fuel
- `analytics.profitPerMile` - Profit per mile
- `analytics.eta` - Estimated time of arrival
- `analytics.miles` - Total distance
- `analytics.mpg` - Miles per gallon
- `analytics.fuelType` - Fuel type (Diesel/Gas)
- `analytics.fuelPrice` - Current fuel price
- `analytics.gallonsNeeded` - Gallons required
- `analytics.gross` - Gross payment

## Firebase Integration Examples

### Fetching Loads with Analytics
```typescript
import { collection, query, where, getDocs } from 'firebase/firestore';

const fetchLoadsWithAnalytics = async (driverId: string) => {
  const loadsRef = collection(db, 'loads');
  const q = query(
    loadsRef,
    where('status', '==', 'posted'),
    where('available', '==', true)
  );
  
  const snapshot = await getDocs(q);
  const loads = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  return loads;
};
```

### Updating Load Analytics
```typescript
import { doc, updateDoc } from 'firebase/firestore';

const updateLoadAnalytics = async (loadId: string, analytics: LoadAnalytics) => {
  const loadRef = doc(db, 'loads', loadId);
  await updateDoc(loadRef, {
    analytics,
    updatedAt: new Date().toISOString()
  });
};
```

### Real-time Load Updates
```typescript
import { doc, onSnapshot } from 'firebase/firestore';

const subscribeToLoad = (loadId: string, callback: (load: Load) => void) => {
  const loadRef = doc(db, 'loads', loadId);
  
  return onSnapshot(loadRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data()
      } as Load);
    }
  });
};
```

## Performance Optimization

### Memoization
The `LoadCard` component uses `useMemo` to optimize analytics calculations:
- Recalculates only when `load.analytics`, `load.distance`, `load.rate`, or `user` changes
- Prevents unnecessary re-renders
- Maintains consistent performance across iOS, Android, and Web

### Fallback Values
All data bindings include fallback values to prevent crashes:
- Numbers default to `0`
- Strings default to `'N/A'` or empty string
- Objects use optional chaining (`?.`)

## Testing Checklist

### Data Binding Tests
- [ ] Load displays correctly with all fields populated
- [ ] Load displays correctly with missing optional fields
- [ ] Analytics display when `load.analytics` is provided
- [ ] Analytics calculate correctly when `load.analytics` is missing
- [ ] Fallback values display when required fields are missing
- [ ] Status pills display correctly based on `load.status`
- [ ] AI Score badge displays when `load.aiScore` exists

### Platform Tests
- [ ] iOS: All data displays correctly
- [ ] Android: All data displays correctly
- [ ] Web: All data displays correctly
- [ ] Tablet: Layout adapts correctly
- [ ] Desktop: Layout adapts correctly

### Performance Tests
- [ ] No layout shifts when data loads
- [ ] Smooth scrolling with 50+ load cards
- [ ] Analytics calculations don't block UI
- [ ] Memoization prevents unnecessary re-renders

## Future Firebase Integration

### Recommended Collections
```
/loads/{loadId} - Load documents
/users/{userId} - User profiles
/analytics/{userId} - User analytics
/bids/{bidId} - Load bids
/notifications/{notificationId} - User notifications
```

### Security Rules Example
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /loads/{loadId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      request.auth.token.role == 'shipper';
      allow update: if request.auth != null && 
                      (resource.data.shipperId == request.auth.uid ||
                       request.auth.token.role == 'admin');
    }
  }
}
```

## Notes
- All timestamps use ISO 8601 format
- Currency values stored as numbers (cents can be calculated client-side)
- Analytics can be pre-calculated server-side or calculated client-side
- Component maintains backward compatibility with dummy data
