import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface DriverLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
  speed?: number | null;
  heading?: number | null;
}

interface UseDriverNavigationReturn {
  currentLocation: DriverLocation | null;
  isNavigating: boolean;
  error: string | null;
}

export default function useDriverNavigation(driverId: string): UseDriverNavigationReturn {
  const [currentLocation, setCurrentLocation] = useState<DriverLocation | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        console.log('[useDriverNavigation] Requesting location permissions for driver:', driverId);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Location permission denied');
          console.error('[useDriverNavigation] Location permission denied');
          return;
        }

        console.log('[useDriverNavigation] Location permission granted, starting tracking');
        setIsNavigating(true);
        setError(null);

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            const newLocation: DriverLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              timestamp: location.timestamp,
              accuracy: location.coords.accuracy ?? undefined,
              speed: location.coords.speed,
              heading: location.coords.heading,
            };

            console.log('[useDriverNavigation] Location update:', {
              lat: newLocation.latitude.toFixed(6),
              lng: newLocation.longitude.toFixed(6),
              speed: newLocation.speed,
            });

            setCurrentLocation(newLocation);
          }
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to start location tracking';
        console.error('[useDriverNavigation] Error starting location tracking:', err);
        setError(errorMessage);
        setIsNavigating(false);
      }
    };

    if (driverId) {
      startLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        console.log('[useDriverNavigation] Cleaning up location subscription');
        locationSubscription.remove();
      }
      setIsNavigating(false);
    };
  }, [driverId]);

  return {
    currentLocation,
    isNavigating,
    error,
  };
}
