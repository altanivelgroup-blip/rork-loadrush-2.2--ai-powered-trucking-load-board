import { z } from 'zod';
import { publicProcedure } from '../../../app-router';

const inputSchema = z.object({
  origin: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  destination: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

function calculateStraightLineRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
) {
  const R = 6371;
  const dLat = ((destination.latitude - origin.latitude) * Math.PI) / 180;
  const dLon = ((destination.longitude - origin.longitude) * Math.PI) / 180;
  const lat1 = (origin.latitude * Math.PI) / 180;
  const lat2 = (destination.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;
  const distanceMiles = distanceKm * 0.621371;

  const avgSpeedMph = 55;
  const durationMin = Math.round((distanceMiles / avgSpeedMph) * 60);
  const hours = Math.floor(durationMin / 60);
  const minutes = durationMin % 60;
  const durationFormatted = hours > 0 ? `${hours} h ${minutes} m` : `${minutes} m`;

  const routeCoords = [
    { latitude: origin.latitude, longitude: origin.longitude },
    { latitude: destination.latitude, longitude: destination.longitude },
  ];

  console.log('[getRouteProcedure] Using fallback straight-line route:', {
    distance: `${distanceMiles.toFixed(1)} mi`,
    duration: durationFormatted,
  });

  return {
    routeCoords,
    distanceKm,
    distanceMiles,
    durationMin,
    durationFormatted,
  };
}

export const getRouteProcedure = publicProcedure
  .input(inputSchema)
  .query(async ({ input, ctx }) => {
    const { origin, destination } = input;

    console.log('[getRouteProcedure] Request received:', {
      origin: `${origin.latitude.toFixed(4)}, ${origin.longitude.toFixed(4)}`,
      destination: `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`,
      hasAuth: !!ctx.token,
    });

    const orsApiKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
    if (!orsApiKey) {
      console.warn('[getRouteProcedure] ORS API key not configured, using fallback');
      return calculateStraightLineRoute(origin, destination);
    }

    const body = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
    };

    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

    let retryCount = 0;
    const MAX_RETRIES = 6;
    const TIMEOUT_MS = 60000;

    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`[getRouteProcedure] Calling ORS API (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`[getRouteProcedure] Request timeout after ${TIMEOUT_MS}ms`);
          controller.abort();
        }, TIMEOUT_MS);

        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: {
              'Authorization': orsApiKey,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'User-Agent': 'LoadRush/1.0',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const text = await res.text().catch(() => '');
            console.error(`[getRouteProcedure] ORS API error: ${res.status}`, text.substring(0, 200));
            
            if (retryCount < MAX_RETRIES && (res.status === 429 || res.status >= 500 || res.status === 408 || res.status === 503)) {
              const delay = Math.min(1500 * Math.pow(2, retryCount), 15000);
              console.log(`[getRouteProcedure] Retrying after ${delay}ms (status: ${res.status})...`);
              await new Promise(resolve => setTimeout(resolve, delay));
              retryCount++;
              continue;
            }
            
            console.warn('[getRouteProcedure] ORS API failed, using fallback');
            return calculateStraightLineRoute(origin, destination);
          }

          const data = await res.json();

          const features = data?.features ?? [];
          if (features.length === 0) {
            console.warn('[getRouteProcedure] No route found, using fallback');
            return calculateStraightLineRoute(origin, destination);
          }

          const route = features[0];
          const geometry = route.geometry;
          const summary = route.properties?.summary;
          const distanceMeters: number = summary?.distance ?? 0;
          const durationSeconds: number = summary?.duration ?? 0;

          const routeCoords = (geometry?.coordinates ?? []).map((coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));

          const distanceKm = distanceMeters / 1000;
          const distanceMiles = distanceKm * 0.621371;
          const durationMin = Math.round(durationSeconds / 60);

          const hours = Math.floor(durationMin / 60);
          const minutes = durationMin % 60;
          const durationFormatted = hours > 0 ? `${hours} h ${minutes} m` : `${minutes} m`;

          console.log('[getRouteProcedure] Route calculated successfully:', {
            points: routeCoords.length,
            distance: `${distanceMiles.toFixed(1)} mi`,
            duration: durationFormatted,
          });

          return {
            routeCoords,
            distanceKm,
            distanceMiles,
            durationMin,
            durationFormatted,
          };
        } catch (fetchError) {
          clearTimeout(timeoutId);
          throw fetchError;
        }
      } catch (err) {
        const isTimeout = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
        const isNetworkError = err instanceof Error && (
          err.message.includes('fetch') ||
          err.message.includes('network') ||
          err.message.includes('Failed to fetch')
        );

        console.error(`[getRouteProcedure] Error (attempt ${retryCount + 1}):`, err instanceof Error ? err.message : err);
        
        if (retryCount < MAX_RETRIES && (isTimeout || isNetworkError)) {
          const delay = Math.min(1500 * Math.pow(2, retryCount), 15000);
          console.log(`[getRouteProcedure] Network/timeout error, retrying after ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          retryCount++;
          continue;
        }
        
        console.warn('[getRouteProcedure] All retries exhausted, using fallback');
        return calculateStraightLineRoute(origin, destination);
      }
    }

    console.warn('[getRouteProcedure] Max retries reached, using fallback');
    return calculateStraightLineRoute(origin, destination);
  });
