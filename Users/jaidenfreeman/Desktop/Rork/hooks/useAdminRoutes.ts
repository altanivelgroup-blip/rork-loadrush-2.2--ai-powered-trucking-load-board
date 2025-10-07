import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface RouteData {
  route: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  totalLoads: number;
  avgRate: number;
  avgETA: number;
  avgDistance: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
}

export interface DriverPerformance {
  driverId: string;
  driverName: string;
  totalLoads: number;
  onTimePercent: number;
  avgDistance: number;
  avgRate: number;
}

export interface AdminRoutesData {
  routes: RouteData[];
  driverPerformance: DriverPerformance[];
  isLoading: boolean;
  error: string | null;
}

interface LoadData {
  id: string;
  originCity: string;
  originState: string;
  destinationCity: string;
  destinationState: string;
  rate: number;
  eta?: number;
  distance?: number;
  status: string;
  assignedDriverId?: string;
  deliveredOnTime?: boolean;
}

interface DriverData {
  id: string;
  name: string;
}

export function useAdminRoutes() {
  const [data, setData] = useState<AdminRoutesData>({
    routes: [],
    driverPerformance: [],
    isLoading: true,
    error: null,
  });

  const [loads, setLoads] = useState<LoadData[]>([]);
  const [drivers, setDrivers] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    console.log('[Admin Routes] Setting up real-time listeners...');

    const loadsQuery = query(collection(db, 'loads'));
    const driversQuery = query(collection(db, 'drivers'));

    const unsubscribeLoads = onSnapshot(
      loadsQuery,
      (snapshot) => {
        console.log('[Admin Routes] Loads snapshot received:', snapshot.size, 'documents');

        const loadData = snapshot.docs.map((doc) => ({
          id: doc.id,
          originCity: doc.data().originCity || 'Unknown',
          originState: doc.data().originState || 'Unknown',
          destinationCity: doc.data().destinationCity || 'Unknown',
          destinationState: doc.data().destinationState || 'Unknown',
          rate: doc.data().rate || 0,
          eta: doc.data().eta || 3,
          distance: doc.data().distance || 0,
          status: doc.data().status || 'pending',
          assignedDriverId: doc.data().assignedDriverId,
          deliveredOnTime: doc.data().deliveredOnTime !== false,
        })) as LoadData[];

        setLoads(loadData);
        setData((prev) => ({ ...prev, isLoading: false }));
      },
      (error) => {
        console.error('[Admin Routes] Error listening to loads:', error);
        setData((prev) => ({
          ...prev,
          error: error.message,
          isLoading: false,
        }));
      }
    );

    const unsubscribeDrivers = onSnapshot(
      driversQuery,
      (snapshot) => {
        console.log('[Admin Routes] Drivers snapshot received:', snapshot.size, 'documents');
        const driverMap = new Map<string, string>();
        snapshot.docs.forEach((doc) => {
          driverMap.set(doc.id, doc.data().name || 'Unknown Driver');
        });
        setDrivers(driverMap);
      },
      (error) => {
        console.error('[Admin Routes] Error listening to drivers:', error);
      }
    );

    return () => {
      console.log('[Admin Routes] Cleaning up listeners...');
      unsubscribeLoads();
      unsubscribeDrivers();
    };
  }, []);

  const routes = useMemo(() => {
    const routeMap = new Map<string, RouteData>();

    loads.forEach((load) => {
      const routeKey = `${load.originCity}, ${load.originState} → ${load.destinationCity}, ${load.destinationState}`;

      if (!routeMap.has(routeKey)) {
        routeMap.set(routeKey, {
          route: routeKey,
          originCity: load.originCity,
          originState: load.originState,
          destinationCity: load.destinationCity,
          destinationState: load.destinationState,
          totalLoads: 0,
          avgRate: 0,
          avgETA: 0,
          avgDistance: 0,
          onTimeDeliveries: 0,
          delayedDeliveries: 0,
        });
      }

      const routeData = routeMap.get(routeKey)!;
      routeData.totalLoads++;
      routeData.avgRate += load.rate;
      routeData.avgETA += load.eta || 3;
      routeData.avgDistance += load.distance || 0;

      if (load.status === 'delivered') {
        if (load.deliveredOnTime) {
          routeData.onTimeDeliveries++;
        } else {
          routeData.delayedDeliveries++;
        }
      }
    });

    const routesArray = Array.from(routeMap.values()).map((route) => ({
      ...route,
      avgRate: route.totalLoads > 0 ? route.avgRate / route.totalLoads : 0,
      avgETA: route.totalLoads > 0 ? route.avgETA / route.totalLoads : 0,
      avgDistance: route.totalLoads > 0 ? route.avgDistance / route.totalLoads : 0,
    }));

    return routesArray.sort((a, b) => b.totalLoads - a.totalLoads).slice(0, 10);
  }, [loads]);

  const driverPerformance = useMemo(() => {
    const driverMap = new Map<string, DriverPerformance>();

    loads.forEach((load) => {
      if (!load.assignedDriverId) return;

      if (!driverMap.has(load.assignedDriverId)) {
        driverMap.set(load.assignedDriverId, {
          driverId: load.assignedDriverId,
          driverName: drivers.get(load.assignedDriverId) || 'Unknown Driver',
          totalLoads: 0,
          onTimePercent: 0,
          avgDistance: 0,
          avgRate: 0,
        });
      }

      const driverData = driverMap.get(load.assignedDriverId)!;
      driverData.totalLoads++;
      driverData.avgDistance += load.distance || 0;
      driverData.avgRate += load.rate;

      if (load.status === 'delivered' && load.deliveredOnTime) {
        driverData.onTimePercent++;
      }
    });

    const driversArray = Array.from(driverMap.values()).map((driver) => ({
      ...driver,
      onTimePercent:
        driver.totalLoads > 0 ? (driver.onTimePercent / driver.totalLoads) * 100 : 0,
      avgDistance: driver.totalLoads > 0 ? driver.avgDistance / driver.totalLoads : 0,
      avgRate: driver.totalLoads > 0 ? driver.avgRate / driver.totalLoads : 0,
    }));

    return driversArray.sort((a, b) => b.totalLoads - a.totalLoads).slice(0, 10);
  }, [loads, drivers]);

  useEffect(() => {
    setData((prev) => ({
      ...prev,
      routes,
      driverPerformance,
    }));
  }, [routes, driverPerformance]);

  return data;
}
