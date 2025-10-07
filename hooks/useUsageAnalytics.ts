import { useState, useEffect } from 'react';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface LoadData {
  id: string;
  createdAt?: Timestamp;
  acceptedAt?: Timestamp;
  status?: string;
}

export interface HourlyActivity {
  hour: number;
  driverActivity: number;
  shipperActivity: number;
}

export interface UsageAnalytics {
  driverActivity: number[];
  shipperActivity: number[];
  hourlyData: HourlyActivity[];
  peakDriverHour: number;
  peakShipperHour: number;
  totalDriverAccepts: number;
  totalShipperPosts: number;
  isLoading: boolean;
  error: string | null;
}

export function useUsageAnalytics(): UsageAnalytics {
  const [analytics, setAnalytics] = useState<UsageAnalytics>({
    driverActivity: Array(24).fill(0),
    shipperActivity: Array(24).fill(0),
    hourlyData: [],
    peakDriverHour: 0,
    peakShipperHour: 0,
    totalDriverAccepts: 0,
    totalShipperPosts: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[Usage Analytics] Setting up real-time listener for load activity...');

    const loadsQuery = collection(db, 'loads');

    const unsubscribe = onSnapshot(
      loadsQuery,
      (snapshot) => {
        console.log('[Usage Analytics] Snapshot received:', snapshot.size, 'loads');

        const driverActivity = Array(24).fill(0);
        const shipperActivity = Array(24).fill(0);
        let totalDriverAccepts = 0;
        let totalShipperPosts = 0;

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as LoadData;

          if (data.createdAt) {
            try {
              const createdDate = data.createdAt.toDate();
              const hour = createdDate.getHours();
              shipperActivity[hour]++;
              totalShipperPosts++;
            } catch {
              console.warn('[Usage Analytics] Invalid createdAt timestamp:', data.id);
            }
          }

          if (data.acceptedAt) {
            try {
              const acceptedDate = data.acceptedAt.toDate();
              const hour = acceptedDate.getHours();
              driverActivity[hour]++;
              totalDriverAccepts++;
            } catch {
              console.warn('[Usage Analytics] Invalid acceptedAt timestamp:', data.id);
            }
          }
        });

        const hourlyData: HourlyActivity[] = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          driverActivity: driverActivity[hour],
          shipperActivity: shipperActivity[hour],
        }));

        const peakDriverHour = driverActivity.indexOf(Math.max(...driverActivity));
        const peakShipperHour = shipperActivity.indexOf(Math.max(...shipperActivity));

        console.log('[Usage Analytics] Computed:', {
          totalDriverAccepts,
          totalShipperPosts,
          peakDriverHour,
          peakShipperHour,
        });

        setAnalytics({
          driverActivity,
          shipperActivity,
          hourlyData,
          peakDriverHour,
          peakShipperHour,
          totalDriverAccepts,
          totalShipperPosts,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        console.error('[Usage Analytics] Error listening to loads:', error);
        setAnalytics((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    return () => {
      console.log('[Usage Analytics] Cleaning up listener...');
      unsubscribe();
    };
  }, []);

  return analytics;
}
