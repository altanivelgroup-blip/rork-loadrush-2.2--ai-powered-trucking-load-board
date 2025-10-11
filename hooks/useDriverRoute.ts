import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

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
const REQUEST_TIMEOUT_MS = 15000;

async function fetchOpenRouteService(params: {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  apiKey: string;
  signal?: AbortSignal;
}) {
  const { origin, destination, apiKey, signal } = params;

  const body = {
    coordinates: [
      [origin.longitude, origin.latitude],
      [destination.longitude, destination.latitude],
    ],
  } as const;

  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`ORS API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data as any;
}

export function useDriverRoute({ origin, destination, enabled = true }: UseDriverRouteParams) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFetchRef = useRef<number>(0);
  const abortRef = useRef<AbortController | null>(null);

  const originKey = origin ? `${origin.latitude},${origin.longitude}` : null;
  const destinationKey = destination ? `${destination.latitude},${destination.longitude}` : null;

  const doFetch = useCallback(async () => {
    if (!origin || !destination || !enabled) {
      return;
    }

    const now = Date.now();
    if (now - lastFetchRef.current < UPDATE_INTERVAL - 1000) {
      return;
    }
    lastFetchRef.current = now;

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const orsApiKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
      if (!orsApiKey) {
        throw new Error('ORS API key not configured');
      }

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT_MS);

      const data = await fetchOpenRouteService({
        origin,
        destination,
        apiKey: orsApiKey,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const features = (data as any)?.features ?? [];
      if (features.length === 0) {
        throw new Error('No route found');
      }

      const route = features[0];
      const geometry = route.geometry;
      const summary = route.properties?.summary;
      const distanceMeters: number = summary?.distance ?? 0;
      const durationSeconds: number = summary?.duration ?? 0;

      const routeCoords: RouteCoordinate[] = (geometry?.coordinates ?? []).map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      const distanceKm = distanceMeters / 1000;
      const distanceMiles = distanceKm * 0.621371;
      const durationMin = Math.round(durationSeconds / 60);

      const hours = Math.floor(durationMin / 60);
      const minutes = durationMin % 60;
      const durationFormatted = hours > 0 ? `${hours} h ${minutes} m` : `${minutes} m`;

      const routeResult: RouteData = {
        routeCoords,
        distanceKm,
        distanceMiles,
        durationMin,
        durationFormatted,
      };

      console.log('[useDriverRoute] Route fetched successfully', {
        points: routeCoords.length,
        distance: `${distanceMiles.toFixed(1)} mi`,
        duration: durationFormatted,
      });

      setRouteData(routeResult);
    } catch (err) {
      console.error('[useDriverRoute] Error fetching route:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch route';
      const webHint = Platform.OS === 'web' ? ' Possible CORS/network issue on web. Consider routing through backend proxy.' : '';
      setError(message + webHint);
    } finally {
      setIsLoading(false);
    }
  }, [origin, destination, enabled]);

  useEffect(() => {
    if (!origin || !destination || !enabled) {
      setRouteData(null);
      return undefined;
    }

    doFetch();

    intervalRef.current = setInterval(() => {
      void doFetch();
    }, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
    // Only re-run when coordinates or enabled change (string keys avoid re-renders on object identity changes)
  }, [originKey, destinationKey, enabled, doFetch]);

  const refetch = useCallback(async () => {
    await doFetch();
  }, [doFetch]);

  return {
    routeData,
    isLoading,
    error,
    refetch,
  } as const;
}
