import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Load } from '@/types';
import { db } from '@/config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

export interface DriverLoadMetrics {
  totalActive: number;
  totalDelivered: number;
  totalDelayed: number;
  totalInTransit: number;
}

export function useDriverLoads() {
  const { user } = useAuth();
  const driverId = user?.id;
  const [rawData, setRawData] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    console.log('[Driver Loads] Setting up query for driverId:', driverId);

    const q = query(
      collection(db, 'loads'),
      where('status', '==', 'Available')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = new Date();
        const loads: Load[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const expiresAt = data.expiresAt?.toDate?.() || new Date();
          
          if (expiresAt >= now) {
            loads.push({
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              expiresAt: expiresAt.toISOString(),
            } as unknown as Load);
          }
        });
        console.log('[Driver Loads] Received', loads.length, 'non-expired loads from Firestore (filtered in memory)');
        setRawData(loads);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[Driver Loads] Error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => {
      console.log('[Driver Loads] Cleaning up listener');
      unsubscribe();
    };
  }, [driverId]);

  const data = useMemo(() => {
    return [...rawData].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [rawData]);

  const activeLoads = useMemo(() => {
    return data;
  }, [data]);

  const completedLoads = useMemo(() => {
    return data.filter((load) => load.status === 'delivered');
  }, [data]);

  const delayedLoads = useMemo(() => {
    return data.filter((load) => {
      if (load.status !== 'in_transit') return false;
      const deliveryDate = new Date(load.dropoff.date);
      const now = new Date();
      return now > deliveryDate;
    });
  }, [data]);

  const metrics: DriverLoadMetrics = useMemo(() => ({
    totalActive: activeLoads.length,
    totalDelivered: completedLoads.length,
    totalDelayed: delayedLoads.length,
    totalInTransit: activeLoads.length,
  }), [activeLoads.length, completedLoads.length, delayedLoads.length]);

  console.log('[Driver Loads] Fetch complete:', {
    uid: driverId,
    total: data.length,
    active: activeLoads.length,
    completed: completedLoads.length,
    delayed: delayedLoads.length,
    loading,
    error: error?.message,
    query: 'status == Available AND expiresAt >= now',
  });

  if (!driverId) {
    console.warn('[Driver Loads] No authenticated user UID');
  }

  if (!loading && data.length === 0 && driverId) {
    console.log('[Driver Loads] No loads found for driver:', driverId);
  }

  return {
    loads: data,
    activeLoads,
    completedLoads,
    delayedLoads,
    metrics,
    loading,
    error,
  };
}
