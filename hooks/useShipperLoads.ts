import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Load } from '@/types';
import { db } from '@/config/firebase';
import { collection, query, where, onSnapshot, QueryConstraint, Timestamp } from 'firebase/firestore';

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
  const [rawData, setRawData] = useState<Load[]>([]);
  const [publicData, setPublicData] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shipperId) {
      setLoading(false);
      return;
    }

    console.log('[Shipper Loads] Setting up query for shipperId:', shipperId);

    const now = Timestamp.now();
    const nowIso = new Date().toISOString();
    const statuses = ['posted', 'matched', 'in_transit'] as const;
    
    // Query for shipper's own loads
    const constraints: QueryConstraint[] = [
      where('shipperId', '==', shipperId),
      where('expiresAt', '>=', now)
    ];

    if (statusFilter && statusFilter !== 'all') {
      constraints.push(where('status', '==', statusFilter));
    }

    const q = query(collection(db, 'loads'), ...constraints);

    // Query for all public loads (to show Command Center loads)
    const constraintsPublic: QueryConstraint[] = [
      where('expiresAt', '>=', now),
      where('status', 'in', statuses as unknown as string[]),
    ];
    const qPublic = query(collection(db, 'loads'), ...constraintsPublic);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loads: Load[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loads.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || nowIso,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || nowIso,
            expiresAt: data.expiresAt?.toDate?.()?.toISOString() || nowIso,
          } as unknown as Load);
        });
        console.log('[Shipper Loads] Received', loads.length, 'own loads from Firestore');
        setRawData(loads);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[Shipper Loads] Error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    const unsubPublic = onSnapshot(
      qPublic,
      (snapshot) => {
        const loads: Load[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          loads.push({
            ...data,
            id: doc.id,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || nowIso,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || nowIso,
            expiresAt: data.expiresAt?.toDate?.()?.toISOString() || nowIso,
          } as unknown as Load);
        });
        console.log('[Shipper Loads] Received', loads.length, 'public loads from Firestore');
        setPublicData(loads);
      },
      (err) => {
        console.error('[Shipper Loads] Public loads error:', err);
      }
    );

    return () => {
      console.log('[Shipper Loads] Cleaning up listeners');
      unsubscribe();
      unsubPublic();
    };
  }, [shipperId, statusFilter]);

  const data = useMemo(() => {
    // Merge own loads with public loads, removing duplicates
    const ownLoadsMap = new Map(rawData.map(load => [load.id, load]));
    const publicLoadsMap = new Map(publicData.map(load => [load.id, load]));
    
    // Combine both, prioritizing own loads
    const combined = new Map([...publicLoadsMap, ...ownLoadsMap]);
    
    return Array.from(combined.values()).sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [rawData, publicData]);

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
      ? `shipperId == ${shipperId} AND expiresAt >= now AND status == ${statusFilter}`
      : `shipperId == ${shipperId} AND expiresAt >= now`,
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
