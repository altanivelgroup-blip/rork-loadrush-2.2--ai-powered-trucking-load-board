import { useState, useCallback } from 'react';
import { db } from '@/config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export function useUpdateLoadStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateStatus = useCallback(async (loadId: string, newStatus: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('[Admin Update Load] Updating load status:', { loadId, newStatus });

      const loadRef = doc(db, 'loads', loadId);
      const updateData: { [key: string]: string | ReturnType<typeof serverTimestamp> } = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };

      if (newStatus === 'delivered') {
        updateData.deliveryTime = serverTimestamp();
      }

      await updateDoc(loadRef, updateData);

      console.log('[Admin Update Load] Load status updated successfully:', { loadId, newStatus });
      return true;
    } catch (err) {
      const error = err as Error;
      console.error('[Admin Update Load] Error updating load status:', error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateStatus,
    loading,
    error,
  };
}
