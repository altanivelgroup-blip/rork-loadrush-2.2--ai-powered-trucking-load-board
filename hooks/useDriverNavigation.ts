import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

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
  setDestination: (destination: NavigationLocation | null) => void;
  startNavigation: (destination: NavigationLocation) => void;
  stopNavigation: () => void;
}

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;

export default function useDriverNavigation(driverId: string): UseDriverNavigationReturn {
  const [currentLocation, setCurrentLocation] = useState<NavigationLocation | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeCoords, setRouteCoords] = useState<NavigationLocation[]>([]);
  const [distance, setDistance] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [destination, setDestination] = useState<NavigationLocation | null>(null);
  const routeRefreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const syncLocationToFirestore = useCallback(async (
    location: NavigationLocation,
    eta?: number,
    distanceRemaining?: number,
    status?: string
  ) => {
    if (!driverId || driverId.startsWith('test-')) {
      console.log('[useDriverNavigation] Test user - skipping Firestore sync');
      return;
    }

    try {
      const driverRef = doc(db, 'drivers', driverId);
      const updateData: any = {
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        updatedAt: serverTimestamp(),
      };

      if (eta !== undefined) {
        updateData.eta = eta;
      }

      if (distanceRemaining !== undefined) {
        updateData.distanceRemaining = distanceRemaining;
      }

      if (status) {
        updateData.status = status;
      }

      await updateDoc(driverRef, updateData);
      console.log('[useDriverNavigation] Location synced to Firestore:', {
        location,
        eta,
        distanceRemaining,
        status,
      });
    } catch (err) {
      console.error('[useDriverNavigation] Error syncing to Firestore:', err);
    }
  }, [driverId]);

  const isNavigatingRef = useRef(isNavigating);
  const durationRef = useRef(duration);
  const distanceRef = useRef(distance);

  useEffect(() => {
    isNavigatingRef.current = isNavigating;
  }, [isNavigating]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);

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

        const newLocation: NavigationLocation = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };

        setCurrentLocation(newLocation);
        await syncLocationToFirestore(
          newLocation,
          undefined,
          undefined,
          isNavigatingRef.current ? 'in_transit' : 'available'
        );

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          async (newLocation) => {
            const updatedLocation: NavigationLocation = {
              lat: newLocation.coords.latitude,
              lng: newLocation.coords.longitude,
            };
            setCurrentLocation(updatedLocation);
            await syncLocationToFirestore(
              updatedLocation,
              durationRef.current > 0 ? durationRef.current : undefined,
              distanceRef.current > 0 ? distanceRef.current : undefined,
              isNavigatingRef.current ? 'in_transit' : 'available'
            );
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
  }, [driverId, syncLocationToFirestore]);

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

      const finalDistance = parseFloat(distanceInMiles.toFixed(2));
      const finalDuration = parseFloat(durationInMinutes.toFixed(1));

      setRouteCoords(coordinates);
      setDistance(finalDistance);
      setDuration(finalDuration);

      console.log('[useDriverNavigation] Route fetched successfully:', {
        points: coordinates.length,
        distance: `${finalDistance} miles`,
        duration: `${finalDuration} minutes`,
      });

      if (origin) {
        await syncLocationToFirestore(
          origin,
          finalDuration,
          finalDistance,
          'in_transit'
        );
      }

      setIsNavigating(false);
    } catch (err) {
      console.error('[useDriverNavigation] Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch route');
      setIsNavigating(false);
    }
  }, [syncLocationToFirestore]);

  useEffect(() => {
    if (routeRefreshIntervalRef.current) {
      clearInterval(routeRefreshIntervalRef.current);
      routeRefreshIntervalRef.current = null;
    }

    if (destination && currentLocation) {
      console.log('[useDriverNavigation] Setting up auto-refresh for route every 15 seconds');
      
      getRoute(currentLocation, destination);

      routeRefreshIntervalRef.current = setInterval(() => {
        if (currentLocation && destination) {
          console.log('[useDriverNavigation] Auto-refreshing route...');
          getRoute(currentLocation, destination);
        }
      }, 15000);
    }

    return () => {
      if (routeRefreshIntervalRef.current) {
        clearInterval(routeRefreshIntervalRef.current);
        routeRefreshIntervalRef.current = null;
      }
    };
  }, [destination, currentLocation, getRoute]);

  const startNavigation = useCallback((dest: NavigationLocation) => {
    console.log('[useDriverNavigation] Starting navigation to:', dest);
    setDestination(dest);
    setIsNavigating(true);
  }, []);

  const stopNavigation = useCallback(async () => {
    console.log('[useDriverNavigation] Stopping navigation');
    setIsNavigating(false);
    setDestination(null);
    setRouteCoords([]);
    setDistance(0);
    setDuration(0);
    
    if (routeRefreshIntervalRef.current) {
      clearInterval(routeRefreshIntervalRef.current);
      routeRefreshIntervalRef.current = null;
    }

    if (currentLocation) {
      await syncLocationToFirestore(
        currentLocation,
        undefined,
        undefined,
        'available'
      );
    }
  }, [currentLocation, syncLocationToFirestore]);

  return {
    currentLocation,
    isNavigating,
    error,
    routeCoords,
    distance,
    duration,
    getRoute,
    setDestination,
    startNavigation,
    stopNavigation,
  };
}
