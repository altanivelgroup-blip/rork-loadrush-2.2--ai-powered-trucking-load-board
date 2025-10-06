import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface LoadStatusCounts {
  active: number;
  pending: number;
  delivered: number;
  cancelled: number;
  total: number;
}

export interface RecentLoad {
  id: string;
  originCity: string;
  destinationCity: string;
  status: string;
  rate: number;
  shipperId: string;
  assignedDriverId?: string;
  createdAt: Timestamp;
}

export interface AdminAnalytics {
  loadCounts: LoadStatusCounts;
  driverCount: number;
  shipperCount: number;
  recentLoads: RecentLoad[];
  loadsByDay: { date: string; count: number }[];
  isLoading: boolean;
  error: string | null;
}

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalytics>({
    loadCounts: { active: 0, pending: 0, delivered: 0, cancelled: 0, total: 0 },
    driverCount: 0,
    shipperCount: 0,
    recentLoads: [],
    loadsByDay: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[Admin Analytics] Setting up real-time listeners...');

    const loadsQuery = query(collection(db, 'loads'), orderBy('createdAt', 'desc'));
    const driversQuery = query(collection(db, 'drivers'));
    const shippersQuery = query(collection(db, 'shippers'));

    const unsubscribeLoads = onSnapshot(
      loadsQuery,
      (snapshot) => {
        console.log('[Admin Analytics] Loads snapshot received:', snapshot.size, 'documents');

        const loads = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RecentLoad[];

        const statusCounts: LoadStatusCounts = {
          active: 0,
          pending: 0,
          delivered: 0,
          cancelled: 0,
          total: loads.length,
        };

        loads.forEach((load) => {
          const status = load.status?.toLowerCase();
          if (status === 'active') statusCounts.active++;
          else if (status === 'pending') statusCounts.pending++;
          else if (status === 'delivered') statusCounts.delivered++;
          else if (status === 'cancelled') statusCounts.cancelled++;
        });

        const loadsByDay = calculateLoadsByDay(loads);

        const recentLoads = loads.slice(0, 10);

        setAnalytics((prev) => ({
          ...prev,
          loadCounts: statusCounts,
          recentLoads,
          loadsByDay,
          isLoading: false,
        }));
      },
      (error) => {
        console.error('[Admin Analytics] Error listening to loads:', error);
        setAnalytics((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    const unsubscribeDrivers = onSnapshot(
      driversQuery,
      (snapshot) => {
        console.log('[Admin Analytics] Drivers snapshot received:', snapshot.size, 'documents');
        setAnalytics((prev) => ({
          ...prev,
          driverCount: snapshot.size,
        }));
      },
      (error) => {
        console.error('[Admin Analytics] Error listening to drivers:', error);
      }
    );

    const unsubscribeShippers = onSnapshot(
      shippersQuery,
      (snapshot) => {
        console.log('[Admin Analytics] Shippers snapshot received:', snapshot.size, 'documents');
        setAnalytics((prev) => ({
          ...prev,
          shipperCount: snapshot.size,
        }));
      },
      (error) => {
        console.error('[Admin Analytics] Error listening to shippers:', error);
      }
    );

    return () => {
      console.log('[Admin Analytics] Cleaning up listeners...');
      unsubscribeLoads();
      unsubscribeDrivers();
      unsubscribeShippers();
    };
  }, []);

  return analytics;
}

function calculateLoadsByDay(loads: RecentLoad[]): { date: string; count: number }[] {
  const dayMap = new Map<string, number>();

  loads.forEach((load) => {
    if (load.createdAt) {
      const date = load.createdAt.toDate();
      const dateKey = date.toISOString().split('T')[0];
      dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + 1);
    }
  });

  const sortedDays = Array.from(dayMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  return sortedDays;
}
