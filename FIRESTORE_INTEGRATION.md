# 🔥 Firestore Integration Guide

## ✅ Setup Complete

Firebase Firestore has been successfully integrated into your LoadRush app with real-time sync capabilities.

## 📦 Available Hooks

### 1. `useFirestore()` - CRUD Operations

Provides methods for basic Firestore operations with loading states and error handling.

```typescript
import { useFirestore } from '@/hooks/useFirestore';

const { loading, error, getDocument, getCollection, addDocument, setDocument, updateDocument, deleteDocument } = useFirestore();

// Get a single document
const load = await getDocument<Load>('loads', 'load123');

// Get a collection with filters
const loads = await getCollection<Load>('loads', {
  queries: [{ field: 'status', operator: '==', value: 'pending' }],
  orderByField: { field: 'createdAt', direction: 'desc' },
  limitCount: 10,
});

// Add a new document (auto-generated ID)
const docId = await addDocument('loads', { origin: 'NYC', destination: 'LA' });

// Set a document (with specific ID)
await setDocument('loads', 'load123', { origin: 'NYC', destination: 'LA' }, true);

// Update a document
await updateDocument('loads', 'load123', { status: 'in-transit' });

// Delete a document
await deleteDocument('loads', 'load123');
```

### 2. `useCollectionData()` - Real-time Collection Listener

Automatically syncs with a Firestore collection and updates when data changes.

```typescript
import { useCollectionData } from '@/hooks/useCollectionData';

const { data, loading, error } = useCollectionData<Load>('loads', {
  queries: [{ field: 'status', operator: '==', value: 'pending' }],
  orderByField: { field: 'createdAt', direction: 'desc' },
  limitCount: 10,
});

// data updates automatically when Firestore changes
```

### 3. `useDocumentData()` - Real-time Document Listener

Automatically syncs with a single Firestore document and updates when it changes.

```typescript
import { useDocumentData } from '@/hooks/useDocumentData';

const [selectedId, setSelectedId] = useState<string | null>('load123');
const { data, loading, error } = useDocumentData<Load>('loads', selectedId);

// data updates automatically when the document changes
```

## 🎯 Usage Examples

### Example 1: Admin Dashboard with Real-time Loads

```typescript
import { useCollectionData } from '@/hooks/useCollectionData';

export default function AdminDashboard() {
  const { data: loads, loading } = useCollectionData<Load>('loads', {
    orderByField: { field: 'createdAt', direction: 'desc' },
  });

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      {loads.map(load => (
        <LoadCard key={load.id} load={load} />
      ))}
    </View>
  );
}
```

### Example 2: Driver Profile with Updates

```typescript
import { useDocumentData } from '@/hooks/useDocumentData';
import { useFirestore } from '@/hooks/useFirestore';

export default function DriverProfile({ driverId }: { driverId: string }) {
  const { data: driver, loading } = useDocumentData<Driver>('drivers', driverId);
  const { updateDocument } = useFirestore();

  const handleUpdateStatus = async (status: string) => {
    await updateDocument('drivers', driverId, { status });
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View>
      <Text>{driver?.name}</Text>
      <Button title="Go Online" onPress={() => handleUpdateStatus('online')} />
    </View>
  );
}
```

### Example 3: Shipper Load Posting

```typescript
import { useFirestore } from '@/hooks/useFirestore';

export default function PostLoad() {
  const { addDocument, loading } = useFirestore();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');

  const handleSubmit = async () => {
    const newLoad = {
      origin,
      destination,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docId = await addDocument<Load>('loads', newLoad);
    if (docId) {
      console.log('Load posted successfully:', docId);
    }
  };

  return (
    <View>
      <TextInput value={origin} onChangeText={setOrigin} placeholder="Origin" />
      <TextInput value={destination} onChangeText={setDestination} placeholder="Destination" />
      <Button title="Post Load" onPress={handleSubmit} disabled={loading} />
    </View>
  );
}
```

## 🔧 Query Options

### Filtering

```typescript
queries: [
  { field: 'status', operator: '==', value: 'pending' },
  { field: 'weight', operator: '>', value: 1000 },
  { field: 'origin', operator: 'in', value: ['NYC', 'LA', 'CHI'] },
]
```

### Ordering

```typescript
orderByField: { field: 'createdAt', direction: 'desc' }
```

### Limiting

```typescript
limitCount: 10
```

## 📊 Console Logging

All Firestore operations log to the console for debugging:

- `[Firestore]` - CRUD operations
- `[Firestore Listener]` - Real-time listeners

## 🔒 Firestore Security Rules (Development Mode)

Current rules allow unrestricted read/write for testing:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: true;
    }
  }
}
```

⚠️ **Important**: Update these rules before production deployment!

## 🎨 TypeScript Support

All hooks are fully typed. Define your data models:

```typescript
interface Load {
  id: string;
  origin: string;
  destination: string;
  weight: number;
  status: 'pending' | 'in-transit' | 'delivered';
  createdAt: string;
}

const { data } = useCollectionData<Load>('loads');
// data is typed as Load[]
```

## 🧪 Testing

See `hooks/useFirestoreExample.tsx` for a complete working example with:
- Real-time collection sync
- Real-time document sync
- CRUD operations
- Error handling
- Loading states

## 📝 Collections Structure Suggestions

```
/loads
  - id (auto)
  - origin: string
  - destination: string
  - weight: number
  - status: string
  - driverId: string | null
  - shipperId: string
  - createdAt: timestamp

/drivers
  - id (userId)
  - name: string
  - email: string
  - status: 'online' | 'offline' | 'busy'
  - currentLoadId: string | null
  - rating: number

/shippers
  - id (userId)
  - companyName: string
  - email: string
  - activeLoads: number

/analytics
  - id (date or custom)
  - totalLoads: number
  - delayRate: number
  - revenue: number
```

## ✅ Next Steps

1. Define your Firestore collections structure
2. Create TypeScript interfaces for your data models
3. Replace mock data in your components with real Firestore hooks
4. Test real-time sync by opening the app in multiple tabs/devices
5. Update Firestore security rules before production

---

**Status**: ✅ Firestore Integration Complete (Development Mode)
**Real-time Sync**: ✅ Enabled
**Console Logging**: ✅ Active
**TypeScript Support**: ✅ Full
