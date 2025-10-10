import { useState, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL, UploadTask } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '@/config/firebase';

export interface ImageUploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

export interface ImageUploadResult {
  downloadURL: string;
  fullPath: string;
}

export function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<ImageUploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const uploadTaskRef = useRef<UploadTask | null>(null);

  const pickImage = useCallback(async (): Promise<string | null> => {
    try {
      console.log('[ImageUpload] Requesting media library permissions...');
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('Permission to access media library is required');
      }

      console.log('[ImageUpload] Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (result.canceled) {
        console.log('[ImageUpload] Image selection canceled');
        return null;
      }

      const uri = result.assets[0].uri;
      console.log('[ImageUpload] Image selected:', uri);
      setImageUri(uri);
      return uri;
    } catch (err) {
      const error = err as Error;
      console.error('[ImageUpload] Error picking image:', error);
      setError(error);
      return null;
    }
  }, []);

  const uploadImage = useCallback(async (
    uri: string,
    userId: string,
    role: 'driver' | 'shipper',
    options?: { skipFirestoreUpdate?: boolean }
  ): Promise<ImageUploadResult | null> => {
    setUploading(true);
    setError(null);
    setProgress(null);
    setSaved(false);

    try {
      console.log(`[ImageUpload] Starting upload for ${role}/${userId}`);
      console.log('[ImageUpload] URI:', uri);
      
      let blob: Blob;
      try {
        const response = await fetch(uri);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        blob = await response.blob();
        console.log('[ImageUpload] Blob created:', blob.size, 'bytes');
      } catch (fetchError) {
        console.error('[ImageUpload] Fetch error:', fetchError);
        throw new Error('Failed to read image file');
      }

      const timestamp = Date.now();
      const storagePath = `uploads/${role}/${userId}/truck_${timestamp}.jpg`;
      console.log('[ImageUpload] Storage path:', storagePath);
      
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: 'image/jpeg',
      });
      uploadTaskRef.current = uploadTask;

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progressData: ImageUploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            };
            setProgress(progressData);
            console.log(`[ImageUpload] Progress: ${progressData.percentage}% (${progressData.bytesTransferred}/${progressData.totalBytes})`);
          },
          (err) => {
            console.error('[ImageUpload] Upload error:', err);
            console.error('[ImageUpload] Error code:', (err as any).code);
            console.error('[ImageUpload] Error message:', err.message);
            setError(err as Error);
            setUploading(false);
            uploadTaskRef.current = null;
            reject(err);
          },
          async () => {
            try {
              console.log('[ImageUpload] Upload completed, getting download URL...');
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const result: ImageUploadResult = {
                downloadURL,
                fullPath: uploadTask.snapshot.ref.fullPath,
              };
              console.log('[ImageUpload] Download URL:', downloadURL);
              
              if (!options?.skipFirestoreUpdate) {
                const collectionName = role === 'driver' ? 'driver_test' : 'shippers';
                const userDocRef = doc(db, collectionName, userId);
                
                console.log(`[ImageUpload] Updating Firestore: ${collectionName}/${userId}`);
                try {
                  await updateDoc(userDocRef, {
                    'truckInfo.photoUrl': downloadURL,
                    'truckInfo.updatedAt': serverTimestamp(),
                  });
                  console.log('[ImageUpload] Firestore updated successfully');
                } catch (firestoreError) {
                  console.warn('[ImageUpload] Firestore update failed (non-critical):', firestoreError);
                }
              } else {
                console.log('[ImageUpload] Skipping Firestore update (skipFirestoreUpdate=true)');
              }
              
              setSaved(true);
              setUploading(false);
              uploadTaskRef.current = null;
              
              setTimeout(() => {
                setSaved(false);
              }, 2000);
              
              resolve(result);
            } catch (err) {
              console.error('[ImageUpload] Error in completion handler:', err);
              setError(err as Error);
              setUploading(false);
              uploadTaskRef.current = null;
              reject(err);
            }
          }
        );
      });
    } catch (err) {
      const error = err as Error;
      console.error('[ImageUpload] Upload failed:', error);
      setError(error);
      setUploading(false);
      uploadTaskRef.current = null;
      return null;
    }
  }, []);

  const cancelUpload = useCallback(() => {
    if (uploadTaskRef.current) {
      console.log('[ImageUpload] Canceling upload...');
      uploadTaskRef.current.cancel();
      uploadTaskRef.current = null;
      setUploading(false);
      setProgress(null);
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(null);
    setError(null);
    setImageUri(null);
    setSaved(false);
    uploadTaskRef.current = null;
  }, []);

  return {
    pickImage,
    uploadImage,
    cancelUpload,
    reset,
    uploading,
    progress,
    error,
    imageUri,
    saved,
  };
}
