# Admin Alerts & Twilio Integration

## Overview
Real-time alert system for the Admin Dashboard that monitors Firestore changes and logs events to `automation_logs` collection. Includes optional Twilio SMS integration.

## Features

### 1. Real-Time Load Monitoring
- Listens to all changes in the `loads` collection
- Detects three types of events:
  - **Load Created**: New load document added
  - **Status Changed**: Load status field updated
  - **Driver Assigned**: assignedDriverId field changed

### 2. Event Logging
All detected events are automatically logged to Firestore:

**Collection**: `automation_logs`

**Document Structure**:
```typescript
{
  type: "loadCreated" | "statusChanged" | "driverAssigned"
  loadId: string
  oldStatus?: string
  newStatus?: string
  oldDriverId?: string
  newDriverId?: string
  timestamp: serverTimestamp()
  triggeredBy: string  // UID of user who triggered the event
  message: string      // Human-readable description
}
```

### 3. Live Alerts Feed
- Displays the 10 most recent alerts in the Admin Dashboard
- Color-coded icons:
  - 🟢 Green: New Load Created
  - 🟡 Yellow: Status Changed
  - 🔵 Blue: Driver Assigned
- Shows relative timestamps (e.g., "2m ago", "1h ago")
- Auto-updates in real-time (no refresh needed)

### 4. Twilio SMS Integration (Optional)

#### Setup
Add these environment variables to enable Twilio alerts:

```env
EXPO_PUBLIC_TWILIO_ENDPOINT=https://your-twilio-function-url.com/send-sms
EXPO_PUBLIC_ADMIN_PHONE=+1234567890
```

#### SMS Payload
```json
{
  "to": "+1234567890",
  "message": "[LoadRush Alert] New load posted: Atlanta → Miami",
  "alertType": "loadCreated",
  "loadId": "abc123xyz"
}
```

#### Twilio Function Example
```javascript
exports.handler = function(context, event, callback) {
  const client = context.getTwilioClient();
  
  client.messages
    .create({
      body: event.message,
      from: context.TWILIO_PHONE_NUMBER,
      to: event.to
    })
    .then(message => {
      callback(null, { success: true, sid: message.sid });
    })
    .catch(error => {
      callback(error);
    });
};
```

## Usage

### Hook: `useAdminAlerts()`

```typescript
import { useAdminAlerts } from '@/hooks/useAdminAlerts';

const { alerts, isLoading, error } = useAdminAlerts();

// alerts: Alert[] - Array of recent alerts
// isLoading: boolean - Loading state
// error: string | null - Error message if any
```

### Alert Type Definition

```typescript
export type AlertType = 'loadCreated' | 'statusChanged' | 'driverAssigned';

export interface Alert {
  id: string;
  type: AlertType;
  loadId: string;
  oldStatus?: string;
  newStatus?: string;
  oldDriverId?: string;
  newDriverId?: string;
  timestamp: Timestamp;
  triggeredBy?: string;
  message: string;
}
```

## Implementation Details

### Event Detection Logic

1. **Initial Load Skip**: When the hook first mounts, it caches all existing loads but doesn't trigger alerts (prevents false positives on page load)

2. **Change Detection**: Uses `snapshot.docChanges()` to detect:
   - `added`: New document created
   - `modified`: Existing document updated

3. **Field Comparison**: For modified documents, compares cached data with new data to detect specific field changes

4. **Automatic Logging**: Every detected event is logged to `automation_logs` collection

5. **SMS Notification**: If Twilio is configured, sends SMS for critical events

### Performance Considerations

- Uses `onSnapshot()` for real-time updates (no polling)
- Caches load data in memory to detect changes efficiently
- Limits alerts display to 10 most recent
- Cleans up listeners on unmount

## Console Logging

All operations are logged with `[Admin Alerts]` prefix:

```
[Admin Alerts] Setting up real-time load listener...
[Admin Alerts] Loads snapshot received: 15 documents
[Admin Alerts] New load created: abc123xyz
[Admin Alerts] Logging alert to Firestore: loadCreated
[Admin Alerts] Alert logged successfully: log456def
[Admin Alerts] Attempting to send Twilio SMS for: loadCreated
[Admin Alerts] Twilio SMS sent successfully
```

## Firestore Security Rules

Ensure your Firestore rules allow admins to write to `automation_logs`:

```javascript
match /automation_logs/{logId} {
  allow read: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```

## Testing

### Test Load Creation
```javascript
await addDoc(collection(db, 'loads'), {
  originCity: 'Atlanta',
  destinationCity: 'Miami',
  status: 'pending',
  shipperId: 'user123',
  createdAt: serverTimestamp()
});
```

### Test Status Change
```javascript
await updateDoc(doc(db, 'loads', 'loadId'), {
  status: 'active'
});
```

### Test Driver Assignment
```javascript
await updateDoc(doc(db, 'loads', 'loadId'), {
  assignedDriverId: 'driver456'
});
```

## Troubleshooting

### Alerts Not Appearing
1. Check console for `[Admin Alerts]` logs
2. Verify Firestore connection
3. Ensure `automation_logs` collection exists
4. Check Firestore security rules

### Twilio SMS Not Sending
1. Verify environment variables are set
2. Check console for Twilio error messages
3. Verify Twilio endpoint is accessible
4. Check Twilio account balance and phone number verification

### Duplicate Alerts
- This is prevented by the initial load skip logic
- If duplicates occur, check that the hook isn't being mounted multiple times

## Future Enhancements

- [ ] Add alert filtering by type
- [ ] Add alert dismissal functionality
- [ ] Add alert sound notifications
- [ ] Add email notifications
- [ ] Add webhook support for third-party integrations
- [ ] Add alert history page with full search/filter
- [ ] Add alert preferences (which events to monitor)
- [ ] Add batch SMS for multiple admins
