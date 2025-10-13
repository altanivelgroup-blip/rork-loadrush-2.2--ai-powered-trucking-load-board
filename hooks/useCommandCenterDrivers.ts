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

function getDefaultLocation(index: number): { lat: number; lng: number } {
  const defaultLocations = [
    { lat: 36.1699, lng: -115.1398 },
    { lat: 34.0522, lng: -118.2437 },
    { lat: 32.7157, lng: -117.1611 },
    { lat: 33.4484, lng: -112.0740 },
    { lat: 32.7767, lng: -96.7970 },
  ];
  return defaultLocations[index % defaultLocations.length];
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
          console.log(`[useCommandCenterDrivers] Processing driver ${doc.id}:`, {
            firstName: data.firstName,
            lastName: data.lastName,
            name: data.name,
            status: data.status,
            location: data.location,
          });
          
          let status: DriverStatus = 'in_transit';
          if (data.status === 'completed' || data.status === 'accomplished') {
            status = 'accomplished';
          } else if (data.status === 'pickup') {
            status = 'pickup';
          } else if (data.status === 'breakdown') {
            status = 'breakdown';
          } else if (data.status === 'in_transit') {
            status = 'in_transit';
          } else if (data.status === 'active') {
            status = 'in_transit';
          }
          
          const name = data.name || 
                       (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null) ||
                       data.firstName || 
                       data.lastName || 
                       'Unknown Driver';
          
          const driverId = data.driverId || data.id || doc.id;
          
          let location = data.location;
          if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
            if (data.location?.latitude && data.location?.longitude) {
              location = { lat: data.location.latitude, lng: data.location.longitude };
            } else {
              location = getDefaultLocation(driversList.length);
            }
          }
          
          const driver: CommandCenterDriver = {
            id: doc.id,
            driverId,
            name,
            status,
            location,
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


