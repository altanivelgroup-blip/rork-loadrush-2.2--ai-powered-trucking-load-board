# LoadRush 2.2 - Firebase Setup Guide

## Firebase Configuration

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "LoadRush" and follow the setup wizard

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** authentication

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **test mode** (for development)
3. Choose your region

### 4. Set Up Storage

1. Go to **Storage** → **Get started**
2. Start in **test mode** (for development)

### 5. Get Your Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps"
3. Click the web icon (</>) to add a web app
4. Copy the `firebaseConfig` object
5. Replace the placeholder values in `config/firebase.ts`:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Firestore Collections Structure

### users
```
users/{userId}
  - email: string
  - role: "driver" | "shipper" | "admin"
  - createdAt: timestamp
  - profile: object (DriverProfile | ShipperProfile | AdminProfile)
```

### loads
```
loads/{loadId}
  - shipperId: string
  - shipperName: string
  - status: "posted" | "matched" | "in_transit" | "delivered" | "cancelled"
  - pickup: object
  - dropoff: object
  - cargo: object
  - rate: number
  - distance: number
  - ratePerMile: number
  - matchedDriverId?: string
  - matchedDriverName?: string
  - aiScore?: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

## Firestore Security Rules (Development)

For development, use these rules in Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Storage Rules (Development)

For development, use these rules in Storage:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Test Accounts

You can create test accounts for each role:

**Driver:**
- Email: driver@test.com
- Password: test123
- Role: driver

**Shipper:**
- Email: shipper@test.com
- Password: test123
- Role: shipper

**Admin:**
- Email: admin@test.com
- Password: test123
- Role: admin

## Production Security Rules

Before deploying to production, tighten your security rules:

### Firestore Rules (Production)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /loads/{loadId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      request.resource.data.shipperId == request.auth.uid;
      allow update: if request.auth != null && 
                      (resource.data.shipperId == request.auth.uid || 
                       resource.data.matchedDriverId == request.auth.uid);
      allow delete: if request.auth != null && 
                      resource.data.shipperId == request.auth.uid;
    }
  }
}
```

### Storage Rules (Production)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /loads/{loadId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Next Steps

1. Replace Firebase config in `config/firebase.ts`
2. Run the app: `npm start` or `bun start`
3. Create test accounts for each role
4. Test the role-based dashboards
5. Implement real Firestore queries to replace dummy data
6. Add photo upload functionality using Firebase Storage
7. Implement CSV upload for bulk load posting
8. Add real-time listeners for live updates
