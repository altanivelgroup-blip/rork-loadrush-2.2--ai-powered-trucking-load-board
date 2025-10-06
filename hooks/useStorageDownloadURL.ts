import { useState, useCallback, useEffect } from 'react';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';

export function useStorageDownloadURL(path?: string) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getURL = useCallback(async (filePath: string): Promise<string | null> => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[Storage] Getting download URL for: ${filePath}`);
      const storageRef = ref(storage, filePath);
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`[Storage] Download URL retrieved successfully:`, downloadURL);
      setUrl(downloadURL);
      return downloadURL;
    } catch (err) {
      const error = err as Error;
      console.error(`[Storage] Error getting download URL:`, error);
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (path) {
      getURL(path);
    }
  }, [path, getURL]);

  return {
    url,
    loading,
    error,
    getURL,
  };
}
