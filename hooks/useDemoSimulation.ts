import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface SimulationDriver {
  driverId: string;
  name: string;
  currentLocation: { lat: number; lng: number };
  targetLocation: { lat: number; lng: number };
  route: Array<{ lat: number; lng: number }>;
  currentStep: number;
  eta: number;
  distanceRemaining: number;
}

interface UseDemoSimulationProps {
  enabled: boolean;
  durationMinutes?: number;
  drivers: Array<{
    id: string;
    driverId: string;
    name: string;
    location: { lat: number; lng: number };
    pickupLocation?: { latitude: number; longitude: number };
    dropoffLocation?: { latitude: number; longitude: number };
    status: string;
  }>;
}

export function useDemoSimulation({
  enabled,
  durationMinutes = 5,
  drivers,
}: UseDemoSimulationProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [simulationDrivers, setSimulationDrivers] = useState<SimulationDriver[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const generateRoute = useCallback(
    (
      start: { lat: number; lng: number },
      end: { lat: number; lng: number },
      steps: number = 30
    ): Array<{ lat: number; lng: number }> => {
      const route: Array<{ lat: number; lng: number }> = [];

      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const lat = start.lat + (end.lat - start.lat) * progress;
        const lng = start.lng + (end.lng - start.lng) * progress;
        route.push({ lat, lng });
      }

      return route;
    },
    []
  );

  const initializeSimulation = useCallback(() => {
    console.log('[DemoSimulation] Initializing simulation for', drivers.length, 'drivers');

    const simDrivers: SimulationDriver[] = drivers
      .filter((d) => d.status === 'in_transit' || d.status === 'pickup')
      .map((driver) => {
        const start = driver.location;
        const end = driver.dropoffLocation
          ? { lat: driver.dropoffLocation.latitude, lng: driver.dropoffLocation.longitude }
          : { lat: start.lat + 0.5, lng: start.lng + 0.5 };

        const route = generateRoute(start, end, 30);
        const distance = Math.sqrt(
          Math.pow(end.lat - start.lat, 2) + Math.pow(end.lng - start.lng, 2)
        ) * 69;

        return {
          driverId: driver.driverId,
          name: driver.name,
          currentLocation: start,
          targetLocation: end,
          route,
          currentStep: 0,
          eta: durationMinutes,
          distanceRemaining: distance,
        };
      });

    setSimulationDrivers(simDrivers);
    console.log('[DemoSimulation] Initialized', simDrivers.length, 'simulation drivers');
  }, [drivers, durationMinutes, generateRoute]);

  const updateDriverLocation = useCallback(
    async (driverId: string, location: { lat: number; lng: number }) => {
      try {
        const driverDoc = doc(db, 'drivers', driverId);
        await updateDoc(driverDoc, {
          location,
          updatedAt: serverTimestamp(),
        });
        console.log(`[DemoSimulation] Updated ${driverId} location:`, location);
      } catch (error) {
        console.error(`[DemoSimulation] Error updating ${driverId}:`, error);
      }
    },
    []
  );

  const startSimulation = useCallback(() => {
    if (isRunning) return;

    console.log('[DemoSimulation] Starting simulation');
    initializeSimulation();
    setIsRunning(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    const totalDuration = durationMinutes * 60 * 1000;
    const updateInterval = totalDuration / 30;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const currentProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(currentProgress);

      setSimulationDrivers((prevDrivers) => {
        const updatedDrivers = prevDrivers.map((driver) => {
          if (driver.currentStep >= driver.route.length - 1) {
            return driver;
          }

          const nextStep = driver.currentStep + 1;
          const newLocation = driver.route[nextStep];
          const remainingSteps = driver.route.length - nextStep;
          const remainingProgress = remainingSteps / driver.route.length;

          updateDriverLocation(driver.driverId, newLocation);

          return {
            ...driver,
            currentLocation: newLocation,
            currentStep: nextStep,
            eta: durationMinutes * remainingProgress,
            distanceRemaining: driver.distanceRemaining * remainingProgress,
          };
        });

        return updatedDrivers;
      });

      if (currentProgress >= 100) {
        console.log('[DemoSimulation] Simulation complete, resetting...');
        stopSimulation();
        setTimeout(() => {
          resetSimulation();
        }, 2000);
      }
    }, updateInterval);
  }, [
    isRunning,
    durationMinutes,
    initializeSimulation,
    updateDriverLocation,
  ]);

  const stopSimulation = useCallback(() => {
    console.log('[DemoSimulation] Stopping simulation');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const resetSimulation = useCallback(() => {
    console.log('[DemoSimulation] Resetting simulation');
    stopSimulation();
    setProgress(0);
    setSimulationDrivers([]);
    initializeSimulation();
  }, [stopSimulation, initializeSimulation]);

  useEffect(() => {
    if (!enabled) {
      stopSimulation();
    }
  }, [enabled, stopSimulation]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isRunning,
    progress,
    simulationDrivers,
    startSimulation,
    stopSimulation,
    resetSimulation,
  };
}
