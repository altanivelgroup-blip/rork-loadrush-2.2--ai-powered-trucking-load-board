# CollectAPI Fuel Price Integration

## Overview
Live fuel price data from CollectAPI has been successfully integrated into the Driver Dashboard's Live Analytics section.

## Implementation Details

### 1. Custom Hook: `useFuelPrices.ts`
- **Location**: `hooks/useFuelPrices.ts`
- **Purpose**: Fetches and manages diesel fuel prices from CollectAPI
- **Features**:
  - Automatic fetching every 6 hours
  - State-specific diesel prices
  - Fallback to national average if state not found
  - Caching mechanism to reduce API calls
  - Comprehensive error handling and logging

### 2. Environment Variables
The integration uses the following environment variables:
- `EXPO_PUBLIC_COLLECTAPI_URL`: API endpoint (defaults to `https://api.collectapi.com/gasPrice/allUsaPrice`)
- `EXPO_PUBLIC_COLLECTAPI_KEY`: API authorization key (defaults to `apikey 3h76TGQbMdx0Tsny6kjteC:1Yfg3B0w4EkadHza3kUGH6`)

### 3. Driver Dashboard Integration
- **Location**: `app/(driver)/dashboard.tsx`
- **Display**: New "Live Fuel Cost" card showing diesel price per gallon
- **Position**: Between GPS Tracking card and Performance Overview section
- **Design**: Matches existing card styling with accent color border

## Features

### Automatic Updates
- Fetches fuel prices on component mount
- Refreshes every 6 hours automatically
- Manual refetch available via `refetch()` method

### State-Based Pricing
- Attempts to use driver's state from profile (`profile.truckInfo.state`)
- Falls back to national average if state not specified or not found
- Displays state name when available

### Console Logging
Success logs:
```
⛽ Fuel Sync Active - Fetching prices from CollectAPI
✅ Fuel Sync Success - Received data for 51 states
⛽ Diesel price for Texas: $3.45
```

Error logs:
```
❌ Fuel Sync Failed: [error message]
```

## API Response Format
```typescript
interface FuelPricesResponse {
  success: boolean;
  result: Array<{
    state: string;
    gasoline: string;
    midGrade: string;
    premium: string;
    diesel: string;
  }>;
}
```

## UI Layout Lock Compliance
✅ No layout, padding, or header properties were modified
✅ Respects LoadRush UI Layout Lock
✅ New card follows existing design patterns
✅ No changes to bottom tab bar or navigation

## Usage Example
```typescript
const { dieselPrice, loading, error, lastFetch, refetch } = useFuelPrices('Texas');

// dieselPrice: number | null - Current diesel price
// loading: boolean - Loading state
// error: string | null - Error message if any
// lastFetch: Date | null - Last successful fetch timestamp
// refetch: () => Promise<void> - Manual refetch function
```

## Testing
To verify the integration:
1. Open Driver Dashboard
2. Check console for "⛽ Fuel Sync Active" log
3. Verify "Live Fuel Cost" card displays with diesel price
4. Confirm price updates every 6 hours

## Notes
- The hook gracefully handles missing state data by calculating national average
- Price is displayed only when successfully fetched (null check prevents empty card)
- All existing analytics calculations (Profit, MPG, ETA) remain unchanged
- Integration is fully compatible with React Native Web
