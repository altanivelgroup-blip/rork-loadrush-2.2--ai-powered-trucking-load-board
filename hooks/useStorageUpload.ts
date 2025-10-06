import { useState, useCallback } from 'react';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot,
} from 'firebase/storage';
import { storage } from '@/config/firebase';

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadResult {
  downloadURL: string;
  fullPath: string;
  name: string;
}

export function useStorageUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = useCallback(async (
    file: Blob | Uint8Array | ArrayBuffer,
    path: string,
    onProgressUpdate?: (progress: UploadProgress) => void
  ): Promise<UploadResult | null> => {
    setUploading(true);
    setError(null);
    setProgress(null);

    try {
      console.log(`[Storage] Starting upload to: ${path}`);
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progressData: UploadProgress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
            };
            setProgress(progressData);
            if (onProgressUpdate) {
              onProgressUpdate(progressData);
            }
            console.log(`[Storage] Upload progress: ${progressData.progress.toFixed(2)}%`);
          },
          (err) => {
            console.error(`[Storage] Upload error:`, err);
            setError(err as Error);
            setUploading(false);
            reject(err);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              const result: UploadResult = {
                downloadURL,
                fullPath: uploadTask.snapshot.ref.fullPath,
                name: uploadTask.snapshot.ref.name,
              };
              console.log(`[Storage] Upload completed successfully:`, result);
              setUploading(false);
              resolve(result);
            } catch (err) {
              console.error(`[Storage] Error getting download URL:`, err);
              setError(err as Error);
              setUploading(false);
              reject(err);
            }
          }
        );
      });
    } catch (err) {
      const error = err as Error;
      console.error(`[Storage] Upload failed:`, error);
      setError(error);
      setUploading(false);
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(null);
    setError(null);
  }, []);

  return {
    uploadFile,
    uploading,
    progress,
    error,
    reset,
  };
}
