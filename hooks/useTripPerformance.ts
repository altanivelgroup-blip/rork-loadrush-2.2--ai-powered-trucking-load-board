import { useState, useEffect, useMemo } from 'react';
import { collectionGroup, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Platform } from 'react-native';

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

const CACHE_KEY = 'trip_performance_cache';
const CACHE_DURATION = 60000;

export function useTripPerformance(): TripPerformanceMetrics {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const loadFromCache = (): Trip[] | null => {
    if (Platform.OS !== 'web') return null;
    
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < CACHE_DURATION) {
        console.log('[useTripPerformance] Using cached data, age:', Math.round(age / 1000), 'seconds');
        return data;
      }

      console.log('[useTripPerformance] Cache expired, age:', Math.round(age / 1000), 'seconds');
      return null;
    } catch (err) {
      console.error('[useTripPerformance] Cache read error:', err);
      return null;
    }
  };

  const saveToCache = (data: Trip[]) => {
    if (Platform.OS !== 'web') return;
    
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
      console.log('[useTripPerformance] Saved', data.length, 'trips to cache');
    } catch (err) {
      console.error('[useTripPerformance] Cache write error:', err);
    }
  };

  useEffect(() => {
    const cachedTrips = loadFromCache();
    if (cachedTrips) {
      setTrips(cachedTrips);
      setIsLoading(false);
      setLastFetch(Date.now());
    }

    const fetchTrips = () => {
      const now = Date.now();
      if (now - lastFetch < CACHE_DURATION) {
        console.log('[useTripPerformance] Skipping fetch, cache still valid');
        return;
      }

      console.log('[useTripPerformance] Fetching fresh data from Firestore');

      const tripsQuery = query(
        collectionGroup(db, 'trips'),
        where('status', '==', 'completed')
      );

      const unsubscribe = onSnapshot(
        tripsQuery,
        (snapshot) => {
          console.log('[useTripPerformance] Received snapshot with', snapshot.size, 'trips');

          const fetchedTrips: Trip[] = [];
          snapshot.forEach((doc) => {
            fetchedTrips.push(doc.data() as Trip);
          });

          setTrips(fetchedTrips);
          setIsLoading(false);
          setError(null);
          setLastFetch(Date.now());
          saveToCache(fetchedTrips);
        },
        (err) => {
          console.error('[useTripPerformance] Error fetching trips:', err);
          setIsLoading(false);
          setError(err.message);
        }
      );

      return unsubscribe;
    };

    const unsubscribe = fetchTrips();

    const refreshInterval = setInterval(() => {
      console.log('[useTripPerformance] Auto-refresh triggered (60s interval)');
      fetchTrips();
    }, CACHE_DURATION);

    return () => {
      console.log('[useTripPerformance] Cleaning up listener and interval');
      if (unsubscribe) unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [lastFetch]);

  const metrics = useMemo(() => {
    const total = trips.length;

    if (total === 0) {
      return {
        avgDistance: 0,
        avgDuration: 0,
        onTimeRate: 0,
        totalTrips: 0,
        isLoading,
        error,
      };
    }

    const totalDistance = trips.reduce((sum, trip) => sum + (trip.totalDistance || 0), 0);
    const totalDuration = trips.reduce((sum, trip) => sum + (trip.durationMinutes || 0), 0);
    const onTimeTrips = trips.filter((trip) => trip.onTime === true).length;

    const avgDistance = totalDistance / total;
    const avgDuration = totalDuration / total;
    const onTimeRate = (onTimeTrips / total) * 100;

    console.log('[useTripPerformance] Computed metrics (memoized):', {
      avgDistance: avgDistance.toFixed(1),
      avgDuration: avgDuration.toFixed(1),
      onTimeRate: onTimeRate.toFixed(1),
      totalTrips: total,
    });

    return {
      avgDistance,
      avgDuration,
      onTimeRate,
      totalTrips: total,
      isLoading,
      error,
    };
  }, [trips, isLoading, error]);

  return metrics;
}
