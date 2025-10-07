import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface NavigationLocation {
  lat: number;
  lng: number;
}

export interface RouteData {
  coords: NavigationLocation[];
  distance: number;
  duration: number;
}

export interface UseDriverNavigationReturn {
  currentLocation: NavigationLocation | null;
  isNavigating: boolean;
  error: string | null;
  routeCoords: NavigationLocation[];
  distance: number;
  duration: number;
  getRoute: (origin: NavigationLocation, destination: NavigationLocation) => Promise<void>;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function useDriverNavigation(driverId: string): UseDriverNavigationReturn {
  const [currentLocation, setCurrentLocation] = useState<NavigationLocation | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<NavigationLocation[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setCurrentLocation({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (newLocation) => {
            setCurrentLocation({
              lat: newLocation.coords.latitude,
              lng: newLocation.coords.longitude,
            });
          }
        );

        setError(null);
      } catch (err) {
        console.error('[useDriverNavigation] Error starting location tracking:', err);
        setError('Failed to start location tracking');
      }
    };

    if (driverId) {
      startLocationTracking();
    }

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [driverId]);

  const getRoute = useCallback(async (origin: NavigationLocation, destination: NavigationLocation) => {
    if (!MAPBOX_TOKEN) {
      setError('Mapbox token not configured');
      console.error('[useDriverNavigation] EXPO_PUBLIC_MAPBOX_TOKEN is not set');
      return;
    }

    try {
      setIsNavigating(true);
      setError(null);

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;

      console.log('[useDriverNavigation] Fetching route from Mapbox...');
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const geometry = route.geometry;

      const coordinates: NavigationLocation[] = geometry.coordinates.map((coord: [number, number]) => ({
        lng: coord[0],
        lat: coord[1],
      }));

      const distanceInMeters = route.distance;
      const durationInSeconds = route.duration;

      const distanceInMiles = distanceInMeters * 0.000621371;
      const durationInMinutes = durationInSeconds / 60;

      setRouteCoords(coordinates);
      setDistance(parseFloat(distanceInMiles.toFixed(2)));
      setDuration(parseFloat(durationInMinutes.toFixed(1)));

      console.log('[useDriverNavigation] Route fetched successfully:', {
        points: coordinates.length,
        distance: `${distanceInMiles.toFixed(2)} miles`,
        duration: `${durationInMinutes.toFixed(1)} minutes`,
      });

      setIsNavigating(false);
    } catch (err) {
      console.error('[useDriverNavigation] Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch route');
      setIsNavigating(false);
    }
  }, []);

  return {
    currentLocation,
    isNavigating,
    error,
    routeCoords,
    distance,
    duration,
    getRoute,
  };
}
