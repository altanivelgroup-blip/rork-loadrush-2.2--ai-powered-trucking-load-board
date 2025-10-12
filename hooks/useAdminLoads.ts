import { useMemo } from 'react';
import { useCollectionData } from './useCollectionData';
import { Load } from '@/types';

export type AdminLoadFilter = 'all' | 'pending' | 'matched' | 'active' | 'delivered' | 'cancelled';

export interface AdminLoadMetrics {
  totalPending: number;
  totalMatched: number;
  totalActive: number;
  totalDelivered: number;
  totalCancelled: number;
  totalLoads: number;
}

export function useAdminLoads(statusFilter?: AdminLoadFilter, searchQuery?: string) {
  const { data: rawData, loading, error } = useCollectionData<Load>('loads', {});

  const nonExpired = useMemo(() => {
    const now = Date.now();
    return rawData.filter((l) => {
      const expires = (l as any)?.expiresAt;
      const ts = typeof expires === 'string' ? new Date(expires).getTime() : (expires?.toDate?.()?.getTime?.() ?? now);
      return ts >= now;
    });
  }, [rawData]);

  const data = useMemo(() => {
    let filtered = [...nonExpired];

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter((load) => {
        if (statusFilter === 'pending') return load.status === 'posted' || load.status === 'matched';
        if (statusFilter === 'matched') return load.status === 'matched';
        if (statusFilter === 'active') return load.status === 'in_transit';
        if (statusFilter === 'delivered') return load.status === 'delivered';
        if (statusFilter === 'cancelled') return load.status === 'cancelled';
        return true;
      });
    }

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((load) => {
        return (
          load.shipperId?.toLowerCase().includes(query) ||
          load.matchedDriverId?.toLowerCase().includes(query) ||
          load.pickup?.city?.toLowerCase().includes(query) ||
          load.dropoff?.city?.toLowerCase().includes(query) ||
          load.id?.toLowerCase().includes(query)
        );
      });
    }

    return filtered.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [nonExpired, statusFilter, searchQuery]);

  const pendingLoads = useMemo(() => {
    return nonExpired.filter((load) => load.status === 'posted' || load.status === 'matched');
  }, [nonExpired]);

  const matchedLoads = useMemo(() => {
    return nonExpired.filter((load) => load.status === 'matched');
  }, [nonExpired]);

  const activeLoads = useMemo(() => {
    return nonExpired.filter((load) => load.status === 'in_transit');
  }, [nonExpired]);

  const deliveredLoads = useMemo(() => {
    return nonExpired.filter((load) => load.status === 'delivered');
  }, [nonExpired]);

  const cancelledLoads = useMemo(() => {
    return nonExpired.filter((load) => load.status === 'cancelled');
  }, [nonExpired]);

  const metrics: AdminLoadMetrics = useMemo(() => ({
    totalPending: pendingLoads.length,
    totalMatched: matchedLoads.length,
    totalActive: activeLoads.length,
    totalDelivered: deliveredLoads.length,
    totalCancelled: cancelledLoads.length,
    totalLoads: nonExpired.length,
  }), [pendingLoads.length, matchedLoads.length, activeLoads.length, deliveredLoads.length, cancelledLoads.length, nonExpired.length]);

  console.log('[Admin Loads] Fetch complete:', {
    total: nonExpired.length,
    filtered: data.length,
    pending: pendingLoads.length,
    matched: matchedLoads.length,
    active: activeLoads.length,
    delivered: deliveredLoads.length,
    cancelled: cancelledLoads.length,
    loading,
    error: error?.message,
    statusFilter,
    searchQuery,
  });

  return {
    loads: data,
    pendingLoads,
    matchedLoads,
    activeLoads,
    deliveredLoads,
    cancelledLoads,
    metrics,
    loading,
    error,
  } as const;
}
