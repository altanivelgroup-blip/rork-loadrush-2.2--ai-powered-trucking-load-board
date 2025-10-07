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
          
          const driver: CommandCenterDriver = {
            id: doc.id,
            driverId: data.driverId || doc.id,
            name: data.name || 'Unknown Driver',
            status: (data.status as DriverStatus) || 'in_transit',
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

function getDefaultLocation(index: number): { lat: number; lng: number } {
  const locations = [
    { lat: 32.7767, lng: -96.7970 },
    { lat: 29.7604, lng: -95.3698 },
    { lat: 34.0522, lng: -118.2437 },
    { lat: 33.4484, lng: -112.0740 },
    { lat: 41.8781, lng: -87.6298 },
    { lat: 33.7490, lng: -84.3880 },
    { lat: 25.7617, lng: -80.1918 },
    { lat: 28.5383, lng: -81.3792 },
    { lat: 47.6062, lng: -122.3321 },
    { lat: 45.5152, lng: -122.6784 },
  ];
  return locations[index % locations.length];
}

function getMockDrivers(): CommandCenterDriver[] {
  return [
    {
      id: 'mock-1',
      driverId: 'DRV-001',
      name: 'Jake Miller',
      status: 'in_transit',
      location: { lat: 32.7767, lng: -96.7970 },
      currentLoad: 'LOAD-12345',
      lastUpdate: new Date(),
      pickupLocation: { latitude: 32.7767, longitude: -96.7970 },
      dropoffLocation: { latitude: 29.7604, longitude: -95.3698 },
      eta: 45.2,
      distanceRemaining: 32.5,
      updatedAt: new Date(),
    },
    {
      id: 'mock-2',
      driverId: 'DRV-002',
      name: 'Sarah Lopez',
      status: 'pickup',
      location: { lat: 29.7604, lng: -95.3698 },
      currentLoad: 'LOAD-12346',
      lastUpdate: new Date(),
      pickupLocation: { latitude: 29.7604, longitude: -95.3698 },
      dropoffLocation: { latitude: 34.0522, longitude: -118.2437 },
      eta: 12.8,
      distanceRemaining: 8.3,
      updatedAt: new Date(),
    },
    {
      id: 'mock-3',
      driverId: 'DRV-003',
      name: 'Tony Reed',
      status: 'accomplished',
      location: { lat: 34.0522, lng: -118.2437 },
      lastUpdate: new Date(),
      updatedAt: new Date(Date.now() - 3600000),
    },
    {
      id: 'mock-4',
      driverId: 'DRV-004',
      name: 'John Davis',
      status: 'in_transit',
      location: { lat: 33.4484, lng: -112.0740 },
      currentLoad: 'LOAD-12347',
      lastUpdate: new Date(),
      pickupLocation: { latitude: 33.4484, longitude: -112.0740 },
      dropoffLocation: { latitude: 41.8781, longitude: -87.6298 },
      eta: 120.5,
      distanceRemaining: 95.7,
      updatedAt: new Date(),
    },
    {
      id: 'mock-5',
      driverId: 'DRV-005',
      name: 'Rachel Carter',
      status: 'breakdown',
      location: { lat: 41.8781, lng: -87.6298 },
      currentLoad: 'LOAD-12348',
      lastUpdate: new Date(),
      pickupLocation: { latitude: 41.8781, longitude: -87.6298 },
      dropoffLocation: { latitude: 33.7490, longitude: -84.3880 },
      eta: 0,
      distanceRemaining: 58.2,
      updatedAt: new Date(),
    },
    {
      id: 'mock-6',
      driverId: 'DRV-006',
      name: 'Mike Johnson',
      status: 'in_transit',
      location: { lat: 33.7490, lng: -84.3880 },
      currentLoad: 'LOAD-12349',
      lastUpdate: new Date(),
      pickupLocation: { latitude: 33.7490, longitude: -84.3880 },
      dropoffLocation: { latitude: 25.7617, longitude: -80.1918 },
      eta: 78.3,
      distanceRemaining: 62.1,
      updatedAt: new Date(),
    },
  ];
}
