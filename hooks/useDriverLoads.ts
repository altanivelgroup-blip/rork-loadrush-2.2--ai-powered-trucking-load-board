import { useMemo, useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Load } from '@/types';
import { db } from '@/config/firebase';
import { collection, query, where, onSnapshot, Timestamp, QueryConstraint } from 'firebase/firestore';

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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [publicData, setPublicData] = useState<Load[]>([]);
  const hasOwnLoadsRef = useRef<boolean>(false);

  useEffect(() => {
    if (!driverId) {
      console.log('[Driver Loads] No driverId - enabling public loads fallback');
    }

    console.log('[Driver Loads] Setting up listeners for driverId:', driverId);

    const now = Timestamp.now();

    let qAssigned: ReturnType<typeof query> | null = null;
    let qMatched: ReturnType<typeof query> | null = null;

    if (driverId) {
      const constraintsAssigned: QueryConstraint[] = [
        where('assignedDriverId', '==', driverId),
      ];
      qAssigned = query(collection(db, 'loads'), ...constraintsAssigned);

      const constraintsMatched: QueryConstraint[] = [
        where('matchedDriverId', '==', driverId),
      ];
      qMatched = query(collection(db, 'loads'), ...constraintsMatched);
    }

    const nowIso = new Date().toISOString();
    const statuses = ['posted', 'matched', 'in_transit'] as const;

    let unsubPublic: (() => void) | null = null;
    try {
      // Always enable public loads for all drivers to see Command Center loads
      const constraintsPublic: QueryConstraint[] = [
        where('status', 'in', statuses as unknown as string[]),
      ];
      const qPublic = query(collection(db, 'loads'), ...constraintsPublic);
      unsubPublic = onSnapshot(
        qPublic,
        (snapshot) => {
          const list: Load[] = snapshot.docs.map((doc) => {
            const data: any = doc.data?.() ?? doc.data;
            return {
              ...data,
              id: doc.id,
              createdAt: data?.createdAt?.toDate?.()?.toISOString?.() ?? data?.createdAt ?? nowIso,
              updatedAt: data?.updatedAt?.toDate?.()?.toISOString?.() ?? data?.updatedAt ?? nowIso,
              expiresAt: data?.expiresAt?.toDate?.()?.toISOString?.() ?? data?.expiresAt ?? nowIso,
            } as Load;
          }).filter((l) => {
            const exp = l?.expiresAt ? new Date(l.expiresAt).getTime() : 0;
            return exp >= new Date().getTime();
          });
          console.log('[Driver Loads] Public loads snapshot (filtered by expiresAt>=now):', list.length);
          setPublicData(list);
        },
        (err) => {
          console.error('[Driver Loads] Public listener error:', err);
        }
      );
    } catch (err) {
      console.error('[Driver Loads] Failed to init public loads listener:', err);
    }

    const nextStateFromSnapshot = (existing: Record<string, Load>, docs: any[]) => {
      const result: Record<string, Load> = { ...existing };
      docs.forEach((doc) => {
        const data = doc.data?.() ?? doc.data;
        const createdAtIso = data?.createdAt?.toDate?.()?.toISOString?.() ?? data?.createdAt ?? new Date().toISOString();
        const updatedAtIso = data?.updatedAt?.toDate?.()?.toISOString?.() ?? data?.updatedAt ?? new Date().toISOString();
        const expiresAtIso = data?.expiresAt?.toDate?.()?.toISOString?.() ?? data?.expiresAt ?? new Date().toISOString();
        const item: Load = {
          ...data,
          id: doc.id,
          createdAt: createdAtIso,
          updatedAt: updatedAtIso,
          expiresAt: expiresAtIso,
        } as Load;
        result[item.id] = item;
      });
      return result;
    };

    let combined: Record<string, Load> = {};

    const unsubAssigned = qAssigned
      ? onSnapshot(
          qAssigned,
          (snapshot) => {
            combined = nextStateFromSnapshot(combined, snapshot.docs);
            let arr = Object.values(combined);
            arr = arr.filter((l) => {
              const exp = l?.expiresAt ? new Date(l.expiresAt).getTime() : 0;
              return exp >= new Date().getTime();
            });
            hasOwnLoadsRef.current = arr.length > 0;
            console.log('[Driver Loads] Assigned loads snapshot (filtered by expiresAt>=now):', arr.length);
            setRawData(arr);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('[Driver Loads] Assigned listener error:', err);
            setError(err as Error);
            setLoading(false);
          }
        )
      : () => {};

    const unsubMatched = qMatched
      ? onSnapshot(
          qMatched,
          (snapshot) => {
            combined = nextStateFromSnapshot(combined, snapshot.docs);
            let arr = Object.values(combined);
            arr = arr.filter((l) => {
              const exp = l?.expiresAt ? new Date(l.expiresAt).getTime() : 0;
              return exp >= new Date().getTime();
            });
            hasOwnLoadsRef.current = hasOwnLoadsRef.current || arr.length > 0;
            console.log('[Driver Loads] Matched loads snapshot merged (filtered by expiresAt>=now):', arr.length);
            setRawData(arr);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('[Driver Loads] Matched listener error:', err);
            setError(err as Error);
            setLoading(false);
          }
        )
      : () => {};

    return () => {
      console.log('[Driver Loads] Cleaning up listeners');
      if (unsubAssigned) {
        try { unsubAssigned(); } catch (e) { console.log('[Driver Loads] Assigned unsubscribe error', e); }
      }
      if (unsubMatched) {
        try { unsubMatched(); } catch (e) { console.log('[Driver Loads] Matched unsubscribe error', e); }
      }
      if (unsubPublic) {
        try { unsubPublic(); } catch (e) { console.log('[Driver Loads] Public unsubscribe error', e); }
      }
    };
  }, [driverId]);

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
    return data.filter((l) => l.status === 'in_transit' || l.status === 'matched' || l.status === 'posted');
  }, [data]);

  const completedLoads = useMemo(() => {
    return data.filter((load) => load.status === 'delivered');
  }, [data]);

  const delayedLoads = useMemo(() => {
    return data.filter((load) => {
      if (load.status !== 'in_transit') return false;
      const deliveryDate = load?.dropoff?.date ? new Date(load.dropoff.date) : null;
      const now = new Date();
      return deliveryDate ? now > deliveryDate : false;
    });
  }, [data]);

  const metrics: DriverLoadMetrics = useMemo(() => ({
    totalActive: activeLoads.length,
    totalDelivered: completedLoads.length,
    totalDelayed: delayedLoads.length,
    totalInTransit: activeLoads.filter((l) => l.status === 'in_transit').length,
  }), [activeLoads, completedLoads.length, delayedLoads.length]);

  console.log('[Driver Loads] Fetch complete:', {
    uid: driverId,
    total: data.length,
    usingPublicFallback: !hasOwnLoadsRef.current,
    ownCount: rawData.length,
    publicCount: publicData.length,
    active: activeLoads.length,
    completed: completedLoads.length,
    delayed: delayedLoads.length,
    loading,
    error: error?.message,
    query: 'assignedDriverId==uid OR matchedDriverId==uid AND expiresAt>=now',
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
  } as const;
}
