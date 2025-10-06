import { useState, useCallback } from 'react';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '@/config/firebase';

export function useStorageDelete() {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    setDeleting(true);
    setError(null);
    try {
      console.log(`[Storage] Deleting file: ${path}`);
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
      console.log(`[Storage] File deleted successfully: ${path}`);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error(`[Storage] Error deleting file:`, error);
      setError(error);
      return false;
    } finally {
      setDeleting(false);
    }
  }, []);

  const deleteMultiple = useCallback(async (paths: string[]): Promise<{
    success: string[];
    failed: string[];
  }> => {
    setDeleting(true);
    setError(null);
    const success: string[] = [];
    const failed: string[] = [];

    console.log(`[Storage] Deleting ${paths.length} files...`);

    for (const path of paths) {
      try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        success.push(path);
        console.log(`[Storage] File deleted: ${path}`);
      } catch (err) {
        failed.push(path);
        console.error(`[Storage] Failed to delete: ${path}`, err);
      }
    }

    console.log(`[Storage] Batch delete complete. Success: ${success.length}, Failed: ${failed.length}`);
    setDeleting(false);

    return { success, failed };
  }, []);

  return {
    deleteFile,
    deleteMultiple,
    deleting,
    error,
  };
}
