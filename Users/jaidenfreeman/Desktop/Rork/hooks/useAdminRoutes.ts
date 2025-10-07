import { useState, useEffect } from 'react';
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

export function useAdminRoutes(): AdminRoutesData {
  const [data, setData] = useState<AdminRoutesData>({
    routes: [],
    driverPerformance: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    console.log('[Admin Routes] Setting up real-time listeners...');

    const loadsQuery = query(collection(db, 'loads'));
    const driversQuery = query(collection(db, 'drivers'));

    let loadsData: any[] = [];
    let driversData: any[] = [];

    const unsubscribeLoads = onSnapshot(
      loadsQuery,
      (snapshot) => {
        console.log('[Admin Routes] Loads snapshot received:', snapshot.size, 'documents');
        loadsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        processData();
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
        driversData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        processData();
      },
      (error) => {
        console.error('[Admin Routes] Error listening to drivers:', error);
      }
    );

    function processData() {
      if (loadsData.length === 0) {
        setData({
          routes: [],
          driverPerformance: [],
          isLoading: false,
          error: null,
        });
        return;
      }

      const routeMap = new Map<string, RouteData>();
      const driverMap = new Map<string, DriverPerformance>();

      loadsData.forEach((load) => {
        const originCity = load.originCity || 'Unknown';
        const originState = load.originState || 'Unknown';
        const destinationCity = load.destinationCity || 'Unknown';
        const destinationState = load.destinationState || 'Unknown';
        const routeKey = `${originCity},${originState}-${destinationCity},${destinationState}`;

        if (!routeMap.has(routeKey)) {
          routeMap.set(routeKey, {
            route: routeKey,
            originCity,
            originState,
            destinationCity,
            destinationState,
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
        routeData.avgRate += load.rate || 0;
        routeData.avgETA += load.eta || 0;
        routeData.avgDistance += load.distance || 0;

        const status = load.status?.toLowerCase();
        if (status === 'delivered') {
          routeData.onTimeDeliveries++;
        } else if (status === 'delayed') {
          routeData.delayedDeliveries++;
        }

        const driverId = load.assignedDriverId || load.driverId;
        if (driverId) {
          if (!driverMap.has(driverId)) {
            const driver = driversData.find((d) => d.id === driverId);
            driverMap.set(driverId, {
              driverId,
              driverName: driver?.name || `Driver ${driverId.substring(0, 6)}`,
              totalLoads: 0,
              onTimePercent: 0,
              avgDistance: 0,
              avgRate: 0,
            });
          }

          const driverPerf = driverMap.get(driverId)!;
          driverPerf.totalLoads++;
          driverPerf.avgDistance += load.distance || 0;
          driverPerf.avgRate += load.rate || 0;

          if (status === 'delivered') {
            driverPerf.onTimePercent++;
          }
        }
      });

      const routes = Array.from(routeMap.values()).map((route) => ({
        ...route,
        avgRate: route.totalLoads > 0 ? route.avgRate / route.totalLoads : 0,
        avgETA: route.totalLoads > 0 ? route.avgETA / route.totalLoads : 0,
        avgDistance: route.totalLoads > 0 ? route.avgDistance / route.totalLoads : 0,
      }));

      routes.sort((a, b) => b.totalLoads - a.totalLoads);

      const driverPerformance = Array.from(driverMap.values()).map((driver) => ({
        ...driver,
        avgDistance: driver.totalLoads > 0 ? driver.avgDistance / driver.totalLoads : 0,
        avgRate: driver.totalLoads > 0 ? driver.avgRate / driver.totalLoads : 0,
        onTimePercent: driver.totalLoads > 0 ? (driver.onTimePercent / driver.totalLoads) * 100 : 0,
      }));

      driverPerformance.sort((a, b) => b.totalLoads - a.totalLoads);

      setData({
        routes,
        driverPerformance,
        isLoading: false,
        error: null,
      });

      console.log('[Admin Routes] Processed data:', {
        routesCount: routes.length,
        driversCount: driverPerformance.length,
      });
    }

    return () => {
      console.log('[Admin Routes] Cleaning up listeners...');
      unsubscribeLoads();
      unsubscribeDrivers();
    };
  }, []);

  return data;
}
