import { useState, useEffect } from 'react';
import { collectionGroup, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface TripArchiveItem {
  id: string;
  driverId: string;
  loadId: string | null;
  destination: {
    lat: number;
    lng: number;
  };
  totalDistance: number;
  durationMinutes: number;
  completedAt: Timestamp;
  status: string;
}

export default function useTripArchive() {
  const [trips, setTrips] = useState<TripArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useTripArchive] Setting up real-time listener for all completed trips');

    try {
      const tripsQuery = query(
        collectionGroup(db, 'trips'),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        tripsQuery,
        (snapshot) => {
          const tripsData: TripArchiveItem[] = [];

          snapshot.forEach((doc) => {
            const data = doc.data();
            const pathSegments = doc.ref.path.split('/');
            const driverId = pathSegments[1];

            tripsData.push({
              id: doc.id,
              driverId,
              loadId: data.loadId || null,
              destination: data.destination,
              totalDistance: data.totalDistance || 0,
              durationMinutes: data.durationMinutes || 0,
              completedAt: data.completedAt,
              status: data.status,
            });
          });

          console.log(`[useTripArchive] Loaded ${tripsData.length} completed trips`);
          setTrips(tripsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[useTripArchive] Error fetching trips:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        console.log('[useTripArchive] Cleaning up listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('[useTripArchive] Error setting up listener:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trips');
      setLoading(false);
    }
  }, []);

  return { trips, loading, error };
}
