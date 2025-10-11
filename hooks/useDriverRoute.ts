import { useState, useEffect, useCallback, useRef } from 'react';
import { trpcClient } from '@/lib/trpc';

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
const REQUEST_TIMEOUT_MS = 28000;

function isAbortError(err: unknown): boolean {
  if (!err) return false;
  if (typeof err === 'string') {
    return err === 'effect-cleanup' || err === 'timeout' || err === 'superseded' || /aborted|AbortError/i.test(err);
  }
  const anyErr = err as { name?: string; message?: string };
  return anyErr?.name === 'AbortError' || /aborted|AbortError|effect-cleanup|timeout|superseded/i.test(anyErr?.message ?? '');
}

async function fetchRouteViaBackend(params: {
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}) {
  const { origin, destination } = params;
  return await trpcClient.routing.getRoute.query({ origin, destination });
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
      try {
        abortRef.current.abort('superseded');
      } catch {}
      abortRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    try {
      timeoutId = setTimeout(() => {
        try {
          controller.abort('timeout');
        } catch {}
      }, REQUEST_TIMEOUT_MS);

      const routeResult = await fetchRouteViaBackend({
        origin,
        destination,
      });

      console.log('[useDriverRoute] Route fetched successfully', {
        points: routeResult.routeCoords.length,
        distance: `${routeResult.distanceMiles.toFixed(1)} mi`,
        duration: routeResult.durationFormatted,
      });

      setRouteData(routeResult);
    } catch (err) {
      if (isAbortError(err)) {
        console.warn('[useDriverRoute] Request aborted');
        return;
      }
      console.error('[useDriverRoute] Error fetching route:', err);
      const message = err instanceof Error ? err.message : 'Failed to fetch route';
      if (message.includes('timeout') || message.includes('timed out')) {
        setError('Route calculation timed out. Please try again.');
      } else {
        setError(message);
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [originKey, destinationKey, enabled]);

  useEffect(() => {
    if (!origin || !destination || !enabled) {
      setRouteData(null);
      return undefined;
    }

    void doFetch();

    intervalRef.current = setInterval(() => {
      void doFetch();
    }, UPDATE_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (abortRef.current) {
        try {
          abortRef.current.abort('effect-cleanup');
        } catch {}
        abortRef.current = null;
      }
    };
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
