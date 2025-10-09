# PhotoUploader Component Integration Guide

## Overview
The `PhotoUploader` component is a unified, production-ready photo upload solution for both Driver and Shipper profiles in LoadRush. It handles image selection, Firebase Storage upload with progress tracking, Firestore sync, and provides visual feedback throughout the process.

## Features
✅ Cross-platform support (iOS, Android, Web)
✅ Live upload progress with percentage display
✅ Thumbnail preview after upload
✅ Green "Saved!" animation on Firestore confirmation
✅ Error handling with user-friendly alerts
✅ Optimized with React.memo and useCallback
✅ 16:9 aspect ratio with image editing
✅ Automatic Firestore sync with `photoUrl` and `updatedAt`

## Installation
The component is already created and ready to use:
- `components/PhotoUploader.tsx` - Main component
- `hooks/useImageUpload.ts` - Upload logic hook

## Usage

### Driver Profile Integration
```tsx
import PhotoUploader from '@/components/PhotoUploader';
import { useAuth } from '@/contexts/AuthContext';

function DriverProfileScreen() {
  const { user } = useAuth();
  
  const handlePhotoUploaded = (url: string) => {
    console.log('Photo uploaded:', url);
    // Optional: Update local state or trigger refresh
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile Photo</Text>
      <PhotoUploader
        userId={user?.id || ''}
        role="driver"
        onUploaded={handlePhotoUploaded}
        currentPhotoUrl={user?.profile?.photoUrl}
      />
    </View>
  );
}
```

### Shipper Profile Integration
```tsx
import PhotoUploader from '@/components/PhotoUploader';
import { useAuth } from '@/contexts/AuthContext';

function ShipperProfileScreen() {
  const { user } = useAuth();
  
  const handlePhotoUploaded = (url: string) => {
    console.log('Photo uploaded:', url);
    // Optional: Update local state or trigger refresh
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Company Logo</Text>
      <PhotoUploader
        userId={user?.id || ''}
        role="shipper"
        onUploaded={handlePhotoUploaded}
        currentPhotoUrl={user?.profile?.photoUrl}
      />
    </View>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | Yes | User ID for storage path |
| `role` | `'driver' \| 'shipper'` | Yes | User role for storage organization |
| `onUploaded` | `(url: string) => void` | No | Callback fired when upload completes |
| `currentPhotoUrl` | `string` | No | Existing photo URL to display |

## Firebase Storage Structure
```
uploads/
  ├── driver/
  │   └── {userId}/
  │       └── profile.jpg
  └── shipper/
      └── {userId}/
          └── profile.jpg
```

## Firestore Updates
The component automatically updates the user document:
```typescript
// For drivers: firestore/drivers/{userId}
// For shippers: firestore/shippers/{userId}
{
  photoUrl: "https://storage.googleapis.com/...",
  updatedAt: serverTimestamp()
}
```

## States & Visual Feedback

### 1. Empty State (No Photo)
- Grey placeholder with camera icon
- "Tap to upload photo" text
- "16:9 aspect ratio recommended" subtext

### 2. Uploading State
- Circular ActivityIndicator
- Live percentage progress (0-100%)
- "Uploading..." text

### 3. Success State
- Image preview fills the card
- Green "Saved!" badge with checkmark (2 seconds)
- Fades out automatically

### 4. Error State
- Alert dialog with error message
- "Upload Failed" title
- Retry option that resets state

## Styling
The component uses LoadRush's color palette from `constants/colors.ts`:
- Primary color for progress indicator
- Success green for saved badge
- Card background and shadows match app design
- Responsive 16:9 aspect ratio

## Performance Optimizations
- `React.memo` prevents unnecessary re-renders
- `useCallback` for stable function references
- Upload task cancellation support (future expansion)
- Automatic cleanup on unmount
- Blob conversion for cross-platform compatibility

## Error Handling
All errors are logged with `console.warn` and displayed to users via `Alert.alert`:
- Permission denied
- Network errors
- Firebase Storage errors
- Firestore update errors

## Testing
Test IDs are not added to maintain clean code, but you can add them if needed:
```tsx
<TouchableOpacity testID="photo-uploader-button" ...>
```

## Future Enhancements
- [ ] Add cancel upload button during progress
- [ ] Support multiple photos
- [ ] Add image compression options
- [ ] Support camera capture (not just library)
- [ ] Add crop/rotate tools

## Troubleshooting

### Issue: "Permission to access media library is required"
**Solution**: The component automatically requests permissions. If denied, user must enable in device settings.

### Issue: Upload stuck at 0%
**Solution**: Check Firebase Storage rules and network connection.

### Issue: Firestore not updating
**Solution**: Verify user document exists in `drivers` or `shippers` collection.

### Issue: Image not displaying after upload
**Solution**: Check Firebase Storage CORS configuration for web platform.

## Example Styles for Integration
```typescript
const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 12,
  },
});
```

## Notes
- Component is fully compatible with Expo SDK 53
- Works seamlessly on web and mobile
- Uses existing Firebase configuration from `config/firebase.ts`
- Follows LoadRush design system and conventions
- Optimized for production use with proper error handling
