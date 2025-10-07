import { useState, useEffect } from 'react';
import { collectionGroup, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface TripDataPoint {
  week: string;
  avgDistance: number;
  avgDuration: number;
  tripCount: number;
}

interface TripTrendsData {
  data: TripDataPoint[];
  isLoading: boolean;
  error: string | null;
}

interface Trip {
  status: string;
  totalDistance?: number;
  durationMinutes?: number;
  completedAt?: Timestamp;
}

export function useTripTrends(): TripTrendsData {
  const [trendsData, setTrendsData] = useState<TripTrendsData>({
    data: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[useTripTrends] Setting up real-time listener');

    const tripsQuery = query(
      collectionGroup(db, 'trips'),
      where('status', '==', 'completed')
    );

    const unsubscribe = onSnapshot(
      tripsQuery,
      (snapshot) => {
        console.log('[useTripTrends] Received snapshot with', snapshot.size, 'trips');

        const trips: Trip[] = [];
        snapshot.forEach((doc) => {
          trips.push(doc.data() as Trip);
        });

        if (trips.length === 0) {
          console.log('[useTripTrends] No completed trips found');
          setTrendsData({
            data: [],
            isLoading: false,
            error: null,
          });
          return;
        }

        const weeklyData = new Map<string, { distances: number[]; durations: number[] }>();

        trips.forEach((trip) => {
          if (!trip.completedAt) return;

          const date = trip.completedAt.toDate();
          const weekStart = getWeekStart(date);
          const weekKey = formatWeekKey(weekStart);

          if (!weeklyData.has(weekKey)) {
            weeklyData.set(weekKey, { distances: [], durations: [] });
          }

          const weekData = weeklyData.get(weekKey)!;
          if (trip.totalDistance) weekData.distances.push(trip.totalDistance);
          if (trip.durationMinutes) weekData.durations.push(trip.durationMinutes);
        });

        const dataPoints: TripDataPoint[] = Array.from(weeklyData.entries())
          .map(([week, data]) => {
            const avgDistance = data.distances.length > 0
              ? data.distances.reduce((sum, d) => sum + d, 0) / data.distances.length
              : 0;
            const avgDuration = data.durations.length > 0
              ? data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length
              : 0;

            return {
              week,
              avgDistance,
              avgDuration,
              tripCount: data.distances.length,
            };
          })
          .sort((a, b) => a.week.localeCompare(b.week))
          .slice(-8);

        console.log('[useTripTrends] Calculated weekly trends:', dataPoints);

        setTrendsData({
          data: dataPoints,
          isLoading: false,
          error: null,
        });
      },
      (error) => {
        console.error('[useTripTrends] Error fetching trips:', error);
        setTrendsData({
          data: [],
          isLoading: false,
          error: error.message,
        });
      }
    );

    return () => {
      console.log('[useTripTrends] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  return trendsData;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function formatWeekKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}
