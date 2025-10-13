import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface SimulationConfig {
  driverId: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  durationSeconds: number;
}

export interface UseDemoSimulationReturn {
  isSimulating: boolean;
  startSimulation: (configs: SimulationConfig[]) => void;
  stopSimulation: () => void;
  progress: number;
}

export function useDemoSimulation(): UseDemoSimulationReturn {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configsRef = useRef<SimulationConfig[]>([]);
  const startTimeRef = useRef<number>(0);

  const interpolateLocation = (
    start: { lat: number; lng: number },
    end: { lat: number; lng: number },
    progress: number
  ): { lat: number; lng: number } => {
    return {
      lat: start.lat + (end.lat - start.lat) * progress,
      lng: start.lng + (end.lng - start.lng) * progress,
    };
  };

  const updateDriverLocation = async (driverId: string, location: { lat: number; lng: number }) => {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        lastUpdate: new Date(),
        updatedAt: new Date(),
      });
      console.log(`[DemoSimulation] Updated ${driverId} to`, location);
    } catch (err) {
      console.error(`[DemoSimulation] Error updating ${driverId}:`, err);
    }
  };

  const stopSimulation = useCallback(() => {
    console.log('[DemoSimulation] Stopping simulation');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsSimulating(false);
    setProgress(0);
    configsRef.current = [];
  }, []);

  const startSimulation = useCallback((configs: SimulationConfig[]) => {
    console.log('[DemoSimulation] Starting simulation with', configs.length, 'drivers');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    configsRef.current = configs;
    startTimeRef.current = Date.now();
    setIsSimulating(true);
    setProgress(0);

    const maxDuration = Math.max(...configs.map(c => c.durationSeconds));
    const updateIntervalMs = 500;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const overallProgress = Math.min(elapsed / maxDuration, 1);
      
      setProgress(overallProgress * 100);

      configsRef.current.forEach((config) => {
        const configProgress = Math.min(elapsed / config.durationSeconds, 1);
        const newLocation = interpolateLocation(
          config.startLocation,
          config.endLocation,
          configProgress
        );
        console.log(`[DemoSimulation] Moving ${config.driverId} to (${newLocation.lat.toFixed(4)}, ${newLocation.lng.toFixed(4)}) - ${(configProgress * 100).toFixed(1)}%`);
        updateDriverLocation(config.driverId, newLocation);
      });

      if (overallProgress >= 1) {
        console.log('[DemoSimulation] Simulation complete');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsSimulating(false);
        setProgress(100);
      }
    }, updateIntervalMs);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isSimulating,
    startSimulation,
    stopSimulation,
    progress,
  };
}
