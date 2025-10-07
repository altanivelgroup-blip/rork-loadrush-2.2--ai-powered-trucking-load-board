import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface Trip {
  id: string;
  loadId: string;
  destination: {
    lat: number;
    lng: number;
    address?: string;
  };
  totalDistance: number;
  durationMinutes: number;
  completedAt: Date;
  status: 'completed';
}

export function useTripHistory(driverId: string | undefined) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) {
      console.log('[useTripHistory] No driverId provided');
      setLoading(false);
      return;
    }

    console.log('[useTripHistory] Setting up listener for driver:', driverId);

    try {
      const tripsRef = collection(db, 'drivers', driverId, 'trips');
      const q = query(tripsRef, orderBy('completedAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log('[useTripHistory] Received snapshot with', snapshot.size, 'trips');
          
          const tripsData: Trip[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              loadId: data.loadId || 'Unknown',
              destination: data.destination || { lat: 0, lng: 0 },
              totalDistance: data.totalDistance || 0,
              durationMinutes: data.durationMinutes || 0,
              completedAt: data.completedAt instanceof Timestamp 
                ? data.completedAt.toDate() 
                : new Date(),
              status: 'completed' as const,
            };
          });

          setTrips(tripsData);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('[useTripHistory] Error fetching trips:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => {
        console.log('[useTripHistory] Cleaning up listener');
        unsubscribe();
      };
    } catch (err) {
      console.error('[useTripHistory] Error setting up listener:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, [driverId]);

  return { trips, loading, error };
}
