import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';

export type DriverStatus = 'pickup' | 'in-transit' | 'accomplished' | 'breakdown';

export interface CommandCenterDriver {
  id: string;
  driverId: string;
  name: string;
  status: DriverStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  currentLoad?: string;
  lastUpdate: Date;
}

export function useCommandCenterDrivers() {
  const [drivers, setDrivers] = useState<CommandCenterDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[useCommandCenterDrivers] Setting up Firestore listener');

    const driversQuery = query(
      collection(db, 'drivers'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(
      driversQuery,
      (snapshot) => {
        console.log('[useCommandCenterDrivers] Received snapshot with', snapshot.size, 'drivers');

        const driversList: CommandCenterDriver[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          
          const driver: CommandCenterDriver = {
            id: doc.id,
            driverId: data.driverId || doc.id,
            name: data.name || 'Unknown Driver',
            status: (data.status as DriverStatus) || 'in-transit',
            location: data.location || getDefaultLocation(driversList.length),
            currentLoad: data.currentLoad,
            lastUpdate: data.lastUpdate?.toDate() || new Date(),
          };

          driversList.push(driver);
        });

        if (driversList.length === 0) {
          console.log('[useCommandCenterDrivers] No drivers found, using mock data');
          setDrivers(getMockDrivers());
        } else {
          setDrivers(driversList);
        }

        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useCommandCenterDrivers] Error fetching drivers:', err);
        setError(err.message);
        setDrivers(getMockDrivers());
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

function getDefaultLocation(index: number): { latitude: number; longitude: number } {
  const locations = [
    { latitude: 32.7767, longitude: -96.7970 },
    { latitude: 29.7604, longitude: -95.3698 },
    { latitude: 34.0522, longitude: -118.2437 },
    { latitude: 33.4484, longitude: -112.0740 },
    { latitude: 41.8781, longitude: -87.6298 },
    { latitude: 33.7490, longitude: -84.3880 },
    { latitude: 25.7617, longitude: -80.1918 },
    { latitude: 28.5383, longitude: -81.3792 },
    { latitude: 47.6062, longitude: -122.3321 },
    { latitude: 45.5152, longitude: -122.6784 },
  ];
  return locations[index % locations.length];
}

function getMockDrivers(): CommandCenterDriver[] {
  return [
    {
      id: 'mock-1',
      driverId: 'DRV-001',
      name: 'Jake Miller',
      status: 'in-transit',
      location: { latitude: 32.7767, longitude: -96.7970 },
      currentLoad: 'LOAD-12345',
      lastUpdate: new Date(),
    },
    {
      id: 'mock-2',
      driverId: 'DRV-002',
      name: 'Sarah Lopez',
      status: 'pickup',
      location: { latitude: 29.7604, longitude: -95.3698 },
      currentLoad: 'LOAD-12346',
      lastUpdate: new Date(),
    },
    {
      id: 'mock-3',
      driverId: 'DRV-003',
      name: 'Tony Reed',
      status: 'accomplished',
      location: { latitude: 34.0522, longitude: -118.2437 },
      lastUpdate: new Date(),
    },
    {
      id: 'mock-4',
      driverId: 'DRV-004',
      name: 'John Davis',
      status: 'in-transit',
      location: { latitude: 33.4484, longitude: -112.0740 },
      currentLoad: 'LOAD-12347',
      lastUpdate: new Date(),
    },
    {
      id: 'mock-5',
      driverId: 'DRV-005',
      name: 'Rachel Carter',
      status: 'breakdown',
      location: { latitude: 41.8781, longitude: -87.6298 },
      currentLoad: 'LOAD-12348',
      lastUpdate: new Date(),
    },
    {
      id: 'mock-6',
      driverId: 'DRV-006',
      name: 'Mike Johnson',
      status: 'in-transit',
      location: { latitude: 33.7490, longitude: -84.3880 },
      currentLoad: 'LOAD-12349',
      lastUpdate: new Date(),
    },
  ];
}
