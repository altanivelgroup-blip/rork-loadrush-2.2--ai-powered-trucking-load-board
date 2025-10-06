# Firebase Storage Integration Guide

## Overview
Firebase Storage is now integrated into the LoadRush app with helper hooks for uploading, downloading, and deleting files.

## Available Hooks

### 1. useStorageUpload()
Upload files with progress tracking.

```typescript
import { useStorageUpload } from '@/hooks/useStorageUpload';

const { uploadFile, uploading, progress, error, reset } = useStorageUpload();

// Upload a file
const result = await uploadFile(
  fileBlob,
  'uploads/document.pdf',
  (progress) => {
    console.log(`Progress: ${progress.progress}%`);
  }
);

if (result) {
  console.log('Download URL:', result.downloadURL);
  console.log('Full path:', result.fullPath);
}
```

**Returns:**
- `uploadFile(file, path, onProgressUpdate?)` - Upload function
- `uploading` - Boolean upload state
- `progress` - Object with `{ bytesTransferred, totalBytes, progress }`
- `error` - Error object if upload fails
- `reset()` - Reset state

---

### 2. useStorageDownloadURL()
Get download URLs for stored files.

```typescript
import { useStorageDownloadURL } from '@/hooks/useStorageDownloadURL';

// Auto-fetch on mount
const { url, loading, error } = useStorageDownloadURL('uploads/document.pdf');

// Or fetch manually
const { url, getURL } = useStorageDownloadURL();
const downloadURL = await getURL('uploads/image.jpg');
```

**Returns:**
- `url` - Download URL string
- `loading` - Boolean loading state
- `error` - Error object if fetch fails
- `getURL(path)` - Manual fetch function

---

### 3. useStorageDelete()
Delete files from storage.

```typescript
import { useStorageDelete } from '@/hooks/useStorageDelete';

const { deleteFile, deleteMultiple, deleting, error } = useStorageDelete();

// Delete single file
const success = await deleteFile('uploads/document.pdf');

// Delete multiple files
const result = await deleteMultiple([
  'uploads/file1.pdf',
  'uploads/file2.jpg',
]);
console.log('Success:', result.success);
console.log('Failed:', result.failed);
```

**Returns:**
- `deleteFile(path)` - Delete single file
- `deleteMultiple(paths[])` - Delete multiple files
- `deleting` - Boolean deletion state
- `error` - Error object if deletion fails

---

## Common Use Cases

### Upload User Profile Image
```typescript
const { uploadFile } = useStorageUpload();

const handleImageUpload = async (imageBlob: Blob) => {
  const userId = 'user123';
  const path = `profiles/${userId}/avatar.jpg`;
  
  const result = await uploadFile(imageBlob, path);
  if (result) {
    // Save result.downloadURL to Firestore user document
  }
};
```

### Upload Document with Progress
```typescript
const { uploadFile, progress } = useStorageUpload();

const handleDocUpload = async (file: Blob) => {
  const result = await uploadFile(
    file,
    `documents/${Date.now()}.pdf`,
    (prog) => {
      console.log(`Uploading: ${prog.progress.toFixed(2)}%`);
    }
  );
};
```

### Display Uploaded Image
```typescript
const { url, loading } = useStorageDownloadURL('uploads/image.jpg');

return (
  <View>
    {loading ? (
      <ActivityIndicator />
    ) : url ? (
      <Image source={{ uri: url }} style={{ width: 200, height: 200 }} />
    ) : null}
  </View>
);
```

### Delete Old Files
```typescript
const { deleteFile } = useStorageDelete();

const handleDeleteOldAvatar = async (oldPath: string) => {
  const success = await deleteFile(oldPath);
  if (success) {
    console.log('Old avatar deleted');
  }
};
```

---

## File Path Structure
Recommended folder structure:
```
storage/
├── profiles/
│   └── {userId}/
│       └── avatar.jpg
├── documents/
│   └── {documentId}.pdf
├── loads/
│   └── {loadId}/
│       ├── proof-of-delivery.jpg
│       └── invoice.pdf
└── temp/
    └── {timestamp}-file.ext
```

---

## Storage Rules (Development Mode)
Current rules allow all reads/writes for testing:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ Important:** Update rules before production deployment.

---

## Error Handling
All hooks include error handling with console logging:
```typescript
const { uploadFile, error } = useStorageUpload();

const result = await uploadFile(file, path);
if (error) {
  console.error('Upload failed:', error.message);
  // Show user-friendly error message
}
```

---

## Testing
See `hooks/useStorageExample.tsx` for a complete working example with:
- File upload with progress tracking
- Download URL retrieval
- File deletion
- Error handling

---

## Console Logging
All storage operations log with `[Storage]` prefix:
- `[Storage] Starting upload to: {path}`
- `[Storage] Upload progress: {percentage}%`
- `[Storage] Upload completed successfully`
- `[Storage] Getting download URL for: {path}`
- `[Storage] File deleted successfully: {path}`
- `[Storage] Error: {error message}`

---

## Integration Status
✅ Firebase Storage initialized in `config/firebase.ts`
✅ Upload hook with progress tracking
✅ Download URL hook with auto-fetch
✅ Delete hook with batch operations
✅ Example component for testing
✅ Console logging for debugging
✅ TypeScript types and error handling

**Status:** Firebase Storage integration complete and ready for use.
