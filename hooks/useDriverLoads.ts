import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionData } from './useCollectionData';
import { Load } from '@/types';

export interface DriverLoadMetrics {
  totalActive: number;
  totalDelivered: number;
  totalDelayed: number;
  totalInTransit: number;
}

export function useDriverLoads() {
  const { user } = useAuth();
  const driverId = user?.id;

  const { data: rawData, loading, error } = useCollectionData<Load>('loads', {
    queries: driverId ? [
      { field: 'assignedDriverId', operator: '==', value: driverId },
      { field: 'status', operator: '==', value: 'active' }
    ] : undefined,
  });

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
    query: 'assignedDriverId == uid AND status == active',
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
