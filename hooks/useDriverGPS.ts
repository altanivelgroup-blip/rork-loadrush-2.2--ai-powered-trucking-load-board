import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as Location from 'expo-location';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  updatedAt: Date;
}

export interface UseDriverGPSReturn {
  location: GPSLocation | null;
  isTracking: boolean;
  error: string | null;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
}

const UPDATE_INTERVAL = 10000;

export function useDriverGPS(driverId: string | undefined): UseDriverGPSReturn {
  const [location, setLocation] = useState<GPSLocation | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watcherRef = useRef<Location.LocationSubscription | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const getMockLocation = (): GPSLocation => {
    const mockLocations = [
      { latitude: 32.7767, longitude: -96.7970 },
      { latitude: 29.7604, longitude: -95.3698 },
      { latitude: 34.0522, longitude: -118.2437 },
      { latitude: 33.4484, longitude: -112.0740 },
    ];
    const randomLocation = mockLocations[Math.floor(Math.random() * mockLocations.length)];
    return {
      ...randomLocation,
      updatedAt: new Date(),
    };
  };

  const updateFirestoreLocation = useCallback(async (coords: { latitude: number; longitude: number }) => {
    if (!driverId) {
      console.log('[useDriverGPS] No driver ID - skipping Firestore update');
      return;
    }

    const isTestUser = driverId.startsWith('test-') || 
                       driverId.includes('_TEST_') || 
                       driverId.toUpperCase().includes('TEST');
    
    if (isTestUser) {
      console.log('[useDriverGPS] Test user detected - skipping Firestore update for:', driverId);
      return;
    }

    try {
      const driverRef = doc(db, 'drivers', driverId);
      await setDoc(driverRef, {
        location: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          updatedAt: serverTimestamp(),
        },
      }, { merge: true });
      console.log('[useDriverGPS] Location updated in Firestore:', coords);
    } catch (err) {
      console.error('[useDriverGPS] Error updating Firestore:', err);
    }
  }, [driverId]);

  const startTracking = useCallback(async () => {
    if (!driverId) {
      setError('No driver ID provided');
      return;
    }

    console.log('[useDriverGPS] Starting GPS tracking for driver:', driverId);

    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        setError('Location permission denied');
        Alert.alert(
          'Location Access Required',
          'Location access is required for load tracking. Please enable location permissions in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[useDriverGPS] Location permission granted');

      let currentLocation: Location.LocationObject | null = null;
      
      try {
        currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch (locationError) {
        console.warn('[useDriverGPS] Could not get current location, using mock data:', locationError);
        const mockLoc = getMockLocation();
        setLocation(mockLoc);
        await updateFirestoreLocation(mockLoc);
      }

      if (currentLocation) {
        const newLocation: GPSLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          updatedAt: new Date(),
        };
        setLocation(newLocation);
        await updateFirestoreLocation(newLocation);
      }

      if (Platform.OS === 'web') {
        console.log('[useDriverGPS] Web platform - using mock location updates');
        const mockLoc = getMockLocation();
        setLocation(mockLoc);
        await updateFirestoreLocation(mockLoc);
        setIsTracking(true);
        setError(null);
        return;
      }

      const watcher = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: UPDATE_INTERVAL,
          distanceInterval: 100,
        },
        (locationUpdate) => {
          const now = Date.now();
          if (now - lastUpdateRef.current < UPDATE_INTERVAL) {
            return;
          }

          lastUpdateRef.current = now;

          const newLocation: GPSLocation = {
            latitude: locationUpdate.coords.latitude,
            longitude: locationUpdate.coords.longitude,
            updatedAt: new Date(),
          };

          console.log('[useDriverGPS] Location update:', newLocation);
          setLocation(newLocation);
          updateFirestoreLocation(newLocation);
        }
      );

      watcherRef.current = watcher;
      setIsTracking(true);
      setError(null);
      console.log('[useDriverGPS] GPS tracking started successfully');
    } catch (err) {
      console.error('[useDriverGPS] Error starting GPS tracking:', err);
      setError('Failed to start GPS tracking');
      setIsTracking(false);
    }
  }, [driverId, updateFirestoreLocation]);

  const stopTracking = useCallback(() => {
    console.log('[useDriverGPS] Stopping GPS tracking');
    if (watcherRef.current) {
      watcherRef.current.remove();
      watcherRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (driverId) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [driverId, startTracking, stopTracking]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}
