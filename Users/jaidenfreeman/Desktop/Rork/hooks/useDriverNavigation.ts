import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';
import axios from 'axios';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface Coordinates {
  lat: number;
  lng: number;
}

export default function useDriverNavigation(driverId: string) {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeCoords, setRouteCoords] = useState<Coordinates[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [destination, setDestination] = useState<Coordinates | null>(null);

  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const routeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getRoute = useCallback(async (origin: Coordinates, dest: Coordinates) => {
    try {
      const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
      if (!mapboxToken) {
        throw new Error('Mapbox token not configured');
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&access_token=${mapboxToken}`;
      
      const response = await axios.get(url);
      
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        
        const coords = route.geometry.coordinates.map((coord: [number, number]) => ({
          lng: coord[0],
          lat: coord[1],
        }));
        
        setRouteCoords(coords);
        setDistance(route.distance * 0.000621371);
        setDuration(route.duration / 60);
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      setError('Failed to fetch route');
    }
  }, []);

  const syncLocationToFirestore = useCallback(async (location: Coordinates) => {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        location: {
          lat: location.lat,
          lng: location.lng,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('Error syncing location to Firestore:', err);
    }
  }, [driverId]);

  const startNavigation = useCallback((dest: Coordinates) => {
    setDestination(dest);
    setIsNavigating(true);
    setError(null);

    if (currentLocation) {
      getRoute(currentLocation, dest);
    }

    if (routeIntervalRef.current) {
      clearInterval(routeIntervalRef.current);
    }

    routeIntervalRef.current = setInterval(() => {
      if (currentLocation && dest) {
        getRoute(currentLocation, dest);
      }
    }, 15000);
  }, [currentLocation, getRoute]);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setDestination(null);
    setRouteCoords([]);
    setDistance(null);
    setDuration(null);

    if (routeIntervalRef.current) {
      clearInterval(routeIntervalRef.current);
      routeIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setError('Location permission not granted');
          return;
        }

        locationSubscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            if (isMounted) {
              const coords = {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              };
              
              setCurrentLocation(coords);
              syncLocationToFirestore(coords);

              if (destination && isNavigating) {
                getRoute(coords, destination);
              }
            }
          }
        );
      } catch (err) {
        console.error('Error setting up location tracking:', err);
        setError('Failed to start location tracking');
      }
    };

    setupLocationTracking();

    return () => {
      isMounted = false;
      
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
      }
      
      if (routeIntervalRef.current) {
        clearInterval(routeIntervalRef.current);
      }
    };
  }, [driverId, destination, isNavigating, getRoute, syncLocationToFirestore]);

  return {
    isNavigating,
    currentLocation,
    routeCoords,
    distance,
    duration,
    error,
    startNavigation,
    stopNavigation,
  };
}
