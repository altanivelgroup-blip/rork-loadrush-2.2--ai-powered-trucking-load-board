import { useState, useEffect } from 'react';
import { collectionGroup, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface ArchivedTrip {
  id: string;
  driverId: string;
  loadId: string;
  destination: {
    lat: number;
    lng: number;
  };
  totalDistance: number;
  durationMinutes: number;
  completedAt: Timestamp;
  status: string;
}

export function useTripArchive() {
  const [trips, setTrips] = useState<ArchivedTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useTripArchive] Setting up listener for all completed trips');

    try {
      const tripsQuery = query(
        collectionGroup(db, 'trips'),
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        tripsQuery,
        (snapshot) => {
          console.log(`[useTripArchive] Received ${snapshot.docs.length} completed trips`);

          const tripsData: ArchivedTrip[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            const pathSegments = doc.ref.path.split('/');
            const driverId = pathSegments[1];

            return {
              id: doc.id,
              driverId,
              loadId: data.loadId || 'N/A',
              destination: data.destination || { lat: 0, lng: 0 },
              totalDistance: data.totalDistance || 0,
              durationMinutes: data.durationMinutes || 0,
              completedAt: data.completedAt,
              status: data.status || 'completed',
            };
          });

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
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  return { trips, loading, error };
}
