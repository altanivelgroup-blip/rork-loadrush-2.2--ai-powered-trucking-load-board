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
  .query(async ({ input }) => {
    const { origin, destination } = input;

    const orsApiKey = process.env.EXPO_PUBLIC_ORS_API_KEY;
    if (!orsApiKey) {
      throw new Error('ORS API key not configured');
    }

    const body = {
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
    };

    const url = 'https://api.openrouteservice.org/v2/directions/driving-car';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': orsApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
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

      return {
        routeCoords,
        distanceKm,
        distanceMiles,
        durationMin,
        durationFormatted,
      };
    } catch (err) {
      console.error('[getRouteProcedure] Error:', err);
      throw err;
    }
  });
