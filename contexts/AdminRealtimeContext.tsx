import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type AdminLoadStatus = 'active' | 'pending' | 'delivered' | 'cancelled' | 'in_transit';

export interface AdminRecentLoad {
  id: string;
  originCity?: string;
  destinationCity?: string;
  status?: string;
  rate?: number;
  ratePerMile?: number;
  distance?: number;
  mpg?: number;
  shipperId?: string;
  assignedDriverId?: string;
  createdAt?: Timestamp;
}

export interface AdminStatusCounts {
  active: number;
  pending: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export interface AdminRealtimeState {
  loadCounts: AdminStatusCounts;
  driverCount: number;
  shipperCount: number;
  recentLoads: AdminRecentLoad[];
  loadsByDay: { date: string; count: number }[];
  totalRevenue: number;
  avgRate: number;
  avgMPG: number;
  activeLoads: number;
  deliveredLoads: number;
  inTransitLoads: number;
  delayedLoads: number;
  isLoading: boolean;
  error: string | null;
  lastUpdateTs: number | null;
}

function calcLoadsByDay(loads: AdminRecentLoad[]): { date: string; count: number }[] {
  const dayMap = new Map<string, number>();
  loads.forEach((l) => {
    if (l.createdAt?.toDate) {
      const date = l.createdAt.toDate();
      const key = date.toISOString().split('T')[0];
      dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
    }
  });
  return Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
}

export const [AdminRealtimeProvider, useAdminRealtime] = createContextHook<AdminRealtimeState>(() => {
  const [state, setState] = useState<AdminRealtimeState>({
    loadCounts: { active: 0, pending: 0, delivered: 0, cancelled: 0, total: 0 },
    driverCount: 0,
    shipperCount: 0,
    recentLoads: [],
    loadsByDay: [],
    totalRevenue: 0,
    avgRate: 0,
    avgMPG: 0,
    activeLoads: 0,
    deliveredLoads: 0,
    inTransitLoads: 0,
    delayedLoads: 0,
    isLoading: true,
    error: null,
    lastUpdateTs: null,
  });

  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('[AdminRealtime] Setting up admin-only real-time listeners');
    mountedRef.current = true;

    const loadsQ = query(collection(db, 'loads'), orderBy('createdAt', 'desc'));
    const driversQ = query(collection(db, 'drivers'));
    const shippersQ = query(collection(db, 'shippers'));

    const unsubLoads = onSnapshot(
      loadsQ,
      (snapshot) => {
        console.log('[AdminRealtime][loads] snapshot size:', snapshot.size);
        const loads = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as object) })) as AdminRecentLoad[];

        const counts: AdminStatusCounts = { active: 0, pending: 0, delivered: 0, cancelled: 0, total: loads.length };
        let totalRevenue = 0;
        let totalRatePerMile = 0;
        let totalMPG = 0;
        let rpmCount = 0;
        let mpgCount = 0;
        let active = 0;
        let delivered = 0;
        let inTransit = 0;
        let delayed = 0;

        loads.forEach((l) => {
          const s = (l.status ?? '').toLowerCase();
          if (s === 'active') { counts.active++; active++; }
          else if (s === 'pending') { counts.pending++; delayed++; }
          else if (s === 'delivered') { counts.delivered++; delivered++; }
          else if (s === 'cancelled') { counts.cancelled++; }
          else if (s === 'in_transit') { inTransit++; }

          if (typeof l.ratePerMile === 'number' && typeof l.distance === 'number') {
            totalRevenue += l.ratePerMile * l.distance;
          } else if (typeof l.rate === 'number') {
            totalRevenue += l.rate;
          }
          if (typeof l.ratePerMile === 'number') { totalRatePerMile += l.ratePerMile; rpmCount++; }
          if (typeof l.mpg === 'number') { totalMPG += l.mpg; mpgCount++; }
          else { totalMPG += 7; mpgCount++; }
        });

        const avgRate = rpmCount > 0 ? totalRatePerMile / rpmCount : 0;
        const avgMPG = mpgCount > 0 ? totalMPG / mpgCount : 7;

        const loadsByDay = calcLoadsByDay(loads);
        const recentLoads = loads.slice(0, 10);

        setState((p) => ({
          ...p,
          loadCounts: counts,
          totalRevenue,
          avgRate,
          avgMPG,
          activeLoads: active,
          deliveredLoads: delivered,
          inTransitLoads: inTransit,
          delayedLoads: delayed,
          recentLoads,
          loadsByDay,
          isLoading: false,
          error: null,
          lastUpdateTs: Date.now(),
        }));
      },
      (err) => {
        console.error('[AdminRealtime][loads] error:', err);
        setState((p) => ({ ...p, error: err.message, isLoading: false }));
      }
    );

    const unsubDrivers = onSnapshot(
      driversQ,
      (snap) => {
        console.log('[AdminRealtime][drivers] snapshot size:', snap.size);
        setState((p) => ({ ...p, driverCount: snap.size }));
      },
      (err) => console.error('[AdminRealtime][drivers] error:', err)
    );

    const unsubShippers = onSnapshot(
      shippersQ,
      (snap) => {
        console.log('[AdminRealtime][shippers] snapshot size:', snap.size);
        setState((p) => ({ ...p, shipperCount: snap.size }));
      },
      (err) => console.error('[AdminRealtime][shippers] error:', err)
    );

    return () => {
      console.log('[AdminRealtime] Cleanup listeners');
      mountedRef.current = false;
      unsubLoads();
      unsubDrivers();
      unsubShippers();
    };
  }, []);

  return state;
});
