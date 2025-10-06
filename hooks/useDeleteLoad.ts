import { useState, useCallback } from 'react';
import { db } from '@/config/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

export function useDeleteLoad() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const deleteLoad = useCallback(async (loadId: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Admin Delete Load] Deleting load:', loadId);

      const loadRef = doc(db, 'loads', loadId);
      await deleteDoc(loadRef);

      console.log('[Admin Delete Load] Load deleted successfully:', loadId);
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('[Admin Delete Load] Error deleting load:', error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteLoad,
    loading,
    error,
  };
}
