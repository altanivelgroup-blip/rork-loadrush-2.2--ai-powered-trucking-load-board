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

function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function generateRoadWaypoints(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  numWaypoints: number = 8
): Array<{ lat: number; lng: number }> {
  const waypoints: Array<{ lat: number; lng: number }> = [start];
  
  const latDiff = end.lat - start.lat;
  const lngDiff = end.lng - start.lng;
  const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
  
  const roadCurveIntensity = 0.15;
  const seed = Math.random() * 1000;
  
  for (let i = 1; i < numWaypoints; i++) {
    const t = i / numWaypoints;
    
    const baseLat = start.lat + latDiff * t;
    const baseLng = start.lng + lngDiff * t;
    
    const perpLat = -lngDiff;
    const perpLng = latDiff;
    const perpLength = Math.sqrt(perpLat * perpLat + perpLng * perpLng);
    const normPerpLat = perpLat / perpLength;
    const normPerpLng = perpLng / perpLength;
    
    const curve1 = Math.sin(t * Math.PI * 2 + seed) * roadCurveIntensity;
    const curve2 = Math.sin(t * Math.PI * 4 + seed * 1.3) * roadCurveIntensity * 0.5;
    const totalCurve = (curve1 + curve2) * distance;
    
    waypoints.push({
      lat: baseLat + normPerpLat * totalCurve,
      lng: baseLng + normPerpLng * totalCurve,
    });
  }
  
  waypoints.push(end);
  return waypoints;
}

function interpolateAlongWaypoints(
  waypoints: Array<{ lat: number; lng: number }>,
  progress: number
): { lat: number; lng: number } {
  if (waypoints.length === 0) return { lat: 0, lng: 0 };
  if (waypoints.length === 1) return waypoints[0];
  if (progress <= 0) return waypoints[0];
  if (progress >= 1) return waypoints[waypoints.length - 1];
  
  const easedProgress = easeInOutCubic(progress);
  
  const totalSegments = waypoints.length - 1;
  const segmentProgress = easedProgress * totalSegments;
  const currentSegment = Math.floor(segmentProgress);
  const segmentT = segmentProgress - currentSegment;
  
  if (currentSegment >= totalSegments) {
    return waypoints[waypoints.length - 1];
  }
  
  const start = waypoints[currentSegment];
  const end = waypoints[currentSegment + 1];
  
  return {
    lat: start.lat + (end.lat - start.lat) * segmentT,
    lng: start.lng + (end.lng - start.lng) * segmentT,
  };
}

export function useDemoSimulation(): UseDemoSimulationReturn {
  const [isSimulating, setIsSimulating] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const configsRef = useRef<SimulationConfig[]>([]);
  const waypointsRef = useRef<Map<string, Array<{ lat: number; lng: number }>>>(new Map());
  const startTimeRef = useRef<number>(0);

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
    waypointsRef.current.clear();
  }, []);

  const startSimulation = useCallback((configs: SimulationConfig[]) => {
    console.log('[DemoSimulation] Starting enhanced simulation with', configs.length, 'drivers');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    configsRef.current = configs;
    waypointsRef.current.clear();
    
    configs.forEach((config) => {
      const distance = Math.sqrt(
        Math.pow(config.endLocation.lat - config.startLocation.lat, 2) +
        Math.pow(config.endLocation.lng - config.startLocation.lng, 2)
      );
      const numWaypoints = Math.max(8, Math.floor(distance * 50));
      
      const waypoints = generateRoadWaypoints(
        config.startLocation,
        config.endLocation,
        numWaypoints
      );
      
      waypointsRef.current.set(config.driverId, waypoints);
      console.log(`[DemoSimulation] Generated ${numWaypoints} waypoints for ${config.driverId}`);
    });
    
    startTimeRef.current = Date.now();
    setIsSimulating(true);
    setProgress(0);

    const maxDuration = Math.max(...configs.map(c => c.durationSeconds));
    const updateIntervalMs = 200;

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const overallProgress = Math.min(elapsed / maxDuration, 1);
      
      setProgress(overallProgress * 100);

      configsRef.current.forEach((config) => {
        const configProgress = Math.min(elapsed / config.durationSeconds, 1);
        const waypoints = waypointsRef.current.get(config.driverId);
        
        if (waypoints) {
          const newLocation = interpolateAlongWaypoints(waypoints, configProgress);
          console.log(`[DemoSimulation] Moving ${config.driverId} to (${newLocation.lat.toFixed(4)}, ${newLocation.lng.toFixed(4)}) - ${(configProgress * 100).toFixed(1)}%`);
          updateDriverLocation(config.driverId, newLocation);
        }
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
