import { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface TripPerformanceMetrics {
  avgDistance: number;
  avgDuration: number;
  onTimeRate: number;
  totalTrips: number;
  isLoading: boolean;
  error: string | null;
}

interface Trip {
  status: string;
  totalDistance?: number;
  durationMinutes?: number;
  onTime?: boolean;
}

export function useTripPerformance(): TripPerformanceMetrics {
  const [metrics, setMetrics] = useState<TripPerformanceMetrics>({
    avgDistance: 0,
    avgDuration: 0,
    onTimeRate: 0,
    totalTrips: 0,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[useTripPerformance] Setting up real-time listener');

    const tripsQuery = query(
      collectionGroup(db, 'trips'),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        console.log('[useTripPerformance] Received snapshot with', snapshot.size, 'trips');

        const trips: Trip[] = [];
        snapshot.forEach((doc) => {
          trips.push(doc.data() as Trip);
        });

        const total = trips.length;

        if (total === 0) {
          console.log('[useTripPerformance] No completed trips found');
          setMetrics({
            avgDistance: 0,
            avgDuration: 0,
            onTimeRate: 0,
            totalTrips: 0,
            isLoading: false,
            error: null,
          });
          return;
        }

        const totalDistance = trips.reduce((sum, trip) => sum + (trip.totalDistance || 0), 0);
        const totalDuration = trips.reduce((sum, trip) => sum + (trip.durationMinutes || 0), 0);
        const onTimeTrips = trips.filter((trip) => trip.onTime === true).length;

        const avgDistance = totalDistance / total;
        const avgDuration = totalDuration / total;
        const onTimeRate = (onTimeTrips / total) * 100;

        console.log('[useTripPerformance] Calculated metrics:', {
          avgDistance: avgDistance.toFixed(1),
          avgDuration: avgDuration.toFixed(1),
          onTimeRate: onTimeRate.toFixed(1),
          totalTrips: total,
        });

        setMetrics({
          avgDistance,
          avgDuration,
          onTimeRate,
          totalTrips: total,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        console.error('[useTripPerformance] Error fetching trips:', error);
        setMetrics((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message,
        }));
      }
    );

    return () => {
      console.log('[useTripPerformance] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  return metrics;
}
