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
      console.error('[getRouteProcedure] ORS API key not configured');
      throw new Error('ORS API key not configured');
    }

    const body = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
    };

    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

    let retryCount = 0;
    const MAX_RETRIES = 2;

    while (retryCount <= MAX_RETRIES) {
      try {
        console.log(`[getRouteProcedure] Calling ORS API (attempt ${retryCount + 1}/${MAX_RETRIES + 1})...`);
        
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': orsApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(25000),
        });

        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error(`[getRouteProcedure] ORS API error: ${res.status}`, text);
          
          if (retryCount < MAX_RETRIES && (res.status === 429 || res.status >= 500)) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            continue;
          }
          
          throw new Error(`ORS API error: ${res.status} ${text}`);
        }

        const data = await res.json();

        const features = data?.features ?? [];
        if (features.length === 0) {
          throw new Error('No route found');
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
      } catch (err) {
        console.error(`[getRouteProcedure] Error (attempt ${retryCount + 1}):`, err);
        
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        }
        
        throw err;
      }
    }

    throw new Error('Failed to fetch route after retries');
  });
