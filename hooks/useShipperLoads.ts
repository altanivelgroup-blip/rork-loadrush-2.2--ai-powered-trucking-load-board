import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCollectionData, CollectionQuery } from './useCollectionData';
import { Load } from '@/types';

export type ShipperLoadFilter = 'all' | 'active' | 'pending' | 'delivered' | 'cancelled';

export interface ShipperLoadMetrics {
  totalActive: number;
  totalPending: number;
  totalDelivered: number;
  totalCancelled: number;
  totalLoads: number;
}

export function useShipperLoads(statusFilter?: ShipperLoadFilter) {
  const { user } = useAuth();
  const shipperId = user?.id;

  const queries = useMemo(() => {
    if (!shipperId) return undefined;
    
    const baseQueries: CollectionQuery[] = [
      { field: 'shipperId', operator: '==', value: shipperId }
    ];

    if (statusFilter && statusFilter !== 'all') {
      baseQueries.push({ field: 'status', operator: '==', value: statusFilter });
    }

    return baseQueries;
  }, [shipperId, statusFilter]);

  const { data: rawData, loading, error } = useCollectionData<Load>('loads', {
    queries,
  });

  const data = useMemo(() => {
    return [...rawData].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [rawData]);

  const activeLoads = useMemo(() => {
    return data.filter((load) => load.status === 'in_transit');
  }, [data]);

  const pendingLoads = useMemo(() => {
    return data.filter((load) => load.status === 'posted' || load.status === 'matched');
  }, [data]);

  const deliveredLoads = useMemo(() => {
    return data.filter((load) => load.status === 'delivered');
  }, [data]);

  const cancelledLoads = useMemo(() => {
    return data.filter((load) => load.status === 'cancelled');
  }, [data]);

  const metrics: ShipperLoadMetrics = useMemo(() => ({
    totalActive: activeLoads.length,
    totalPending: pendingLoads.length,
    totalDelivered: deliveredLoads.length,
    totalCancelled: cancelledLoads.length,
    totalLoads: data.length,
  }), [activeLoads.length, pendingLoads.length, deliveredLoads.length, cancelledLoads.length, data.length]);

  console.log('[Shipper Loads] Fetch complete:', {
    uid: shipperId,
    total: data.length,
    active: activeLoads.length,
    pending: pendingLoads.length,
    delivered: deliveredLoads.length,
    cancelled: cancelledLoads.length,
    loading,
    error: error?.message,
    query: statusFilter 
      ? `shipperId == ${shipperId} AND status == ${statusFilter}`
      : `shipperId == ${shipperId}`,
  });

  if (!shipperId) {
    console.warn('[Shipper Loads] No authenticated user UID');
  }

  if (!loading && data.length === 0 && shipperId) {
    console.log('[Shipper Loads] No loads found for shipper:', shipperId);
  }

  return {
    loads: data,
    activeLoads,
    pendingLoads,
    deliveredLoads,
    cancelledLoads,
    metrics,
    loading,
    error,
  };
}
