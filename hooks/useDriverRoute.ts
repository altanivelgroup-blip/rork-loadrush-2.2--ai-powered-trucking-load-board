import { useState, useEffect, useCallback, useRef } from 'react';

export interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

export interface RouteData {
  routeCoords: RouteCoordinate[];
  distanceKm: number;
  distanceMiles: number;
  durationMin: number;
  durationFormatted: string;
  error?: string;
}

export interface UseDriverRouteParams {
  origin: { latitude: number; longitude: number } | null;
  destination: { latitude: number; longitude: number } | null;
  enabled?: boolean;
}

const UPDATE_INTERVAL = 30000;

export function useDriverRoute({ origin, destination, enabled = true }: UseDriverRouteParams) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchRoute = useCallback(async () => {
    if (!origin || !destination || !enabled) {
      return;
    }

    const now = Date.now();
    if (now - lastFetchRef.current < UPDATE_INTERVAL - 1000) {
      return;
    }

    lastFetchRef.current = now;

    console.log('[useDriverRoute] Fetching route from Mapbox Directions API');
    setIsLoading(true);
    setError(null);

    try {
      const mapboxToken = process.env.EXPO_PUBLIC_MAPBOX_TOKEN;
      
      if (!mapboxToken) {
        throw new Error('Mapbox token not configured');
      }

      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?geometries=geojson&access_token=${mapboxToken}`;

      console.log('[useDriverRoute] Request URL:', url.replace(mapboxToken, 'TOKEN'));

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Mapbox API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const geometry = route.geometry;
      const distanceMeters = route.distance;
      const durationSeconds = route.duration;

      const routeCoords: RouteCoordinate[] = geometry.coordinates.map((coord: [number, number]) => ({
        longitude: coord[0],
        latitude: coord[1],
      }));

      const distanceKm = distanceMeters / 1000;
      const distanceMiles = distanceKm * 0.621371;
      const durationMin = Math.round(durationSeconds / 60);

      const hours = Math.floor(durationMin / 60);
      const minutes = durationMin % 60;
      const durationFormatted = hours > 0 
        ? `${hours} h ${minutes} m` 
        : `${minutes} m`;

      const routeResult: RouteData = {
        routeCoords,
        distanceKm,
        distanceMiles,
        durationMin,
        durationFormatted,
      };

      console.log('[useDriverRoute] Route fetched successfully:', {
        distance: `${distanceMiles.toFixed(1)} mi`,
        duration: durationFormatted,
        points: routeCoords.length,
      });

      setRouteData(routeResult);
      setIsLoading(false);
    } catch (err) {
      console.error('[useDriverRoute] Error fetching route:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch route');
      setIsLoading(false);
    }
  }, [origin, destination, enabled]);

  useEffect(() => {
    if (!origin || !destination || !enabled) {
      setRouteData(null);
      return;
    }

    fetchRoute();

    intervalRef.current = setInterval(() => {
      fetchRoute();
    }, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [origin, destination, enabled, fetchRoute]);

  return {
    routeData,
    isLoading,
    error,
    refetch: fetchRoute,
  };
}
