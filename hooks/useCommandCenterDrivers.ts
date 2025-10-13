import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type DriverStatus = 'pickup' | 'in_transit' | 'accomplished' | 'breakdown';

export interface CommandCenterDriver {
  id: string;
  driverId: string;
  name: string;
  status: DriverStatus;
  location: {
    lat: number;
    lng: number;
  };
  currentLoad?: string;
  lastUpdate: Date;
  pickupLocation?: {
    latitude: number;
    longitude: number;
  };
  dropoffLocation?: {
    latitude: number;
    longitude: number;
  };
  eta?: number;
  distanceRemaining?: number;
  updatedAt?: Date;
}

export function useCommandCenterDrivers() {
  const [drivers, setDrivers] = useState<CommandCenterDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useCommandCenterDrivers] Setting up Firestore listener');

    const driversQuery = query(
      collection(db, 'drivers'),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      driversQuery,
      (snapshot) => {
        console.log('[useCommandCenterDrivers] Received snapshot with', snapshot.size, 'drivers');

        const driversList: CommandCenterDriver[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          let status = (data.status as DriverStatus) || 'in_transit';
          if (data.status === 'completed') {
            status = 'accomplished';
          }
          
          const driver: CommandCenterDriver = {
            id: doc.id,
            driverId: data.driverId || doc.id,
            name: data.name || 'Unknown Driver',
            status,
            location: data.location || getDefaultLocation(driversList.length),
            currentLoad: data.currentLoad,
            lastUpdate: data.lastUpdate?.toDate() || new Date(),
            pickupLocation: data.pickupLocation,
            dropoffLocation: data.dropoffLocation,
            eta: data.eta,
            distanceRemaining: data.distanceRemaining,
            updatedAt: data.updatedAt?.toDate() || new Date(),
          };

          driversList.push(driver);
        });

        driversList.sort((a, b) => {
          const statusPriority: Record<DriverStatus, number> = {
            'breakdown': 1,
            'in_transit': 2,
            'pickup': 3,
            'accomplished': 4,
          };
          
          const priorityDiff = statusPriority[a.status] - statusPriority[b.status];
          if (priorityDiff !== 0) return priorityDiff;
          
          return (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0);
        });

        console.log('[useCommandCenterDrivers] Found', driversList.length, 'real drivers');
        setDrivers(driversList);

        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useCommandCenterDrivers] Error fetching drivers:', err);
        setError(err.message);
        setDrivers([]);
        setIsLoading(false);
      }
    );

    return () => {
      console.log('[useCommandCenterDrivers] Cleaning up listener');
      unsubscribe();
    };
  }, []);

  return { drivers, isLoading, error };
}


