import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const FUEL_API_URL = process.env.FUEL_API_URL || "https://zylalabs.com/api/10741/loadrush+v2+api/20317/getfuelpricesbylocation";
const FUEL_API_KEY = process.env.FUEL_API_KEY || "";

if (!FUEL_API_KEY) {
  console.warn("⚠️ FUEL_API_KEY not set in environment variables");
}

const FALLBACK_BY_STATE: Record<string, { diesel: number; gasoline: number }> = {
  "Illinois": { diesel: 3.99, gasoline: 3.79 },
  "Texas": { diesel: 3.49, gasoline: 2.99 },
  "California": { diesel: 5.09, gasoline: 5.39 },
  "Arizona": { diesel: 4.19, gasoline: 3.99 },
  "New York": { diesel: 4.25, gasoline: 3.89 },
  "Florida": { diesel: 3.85, gasoline: 3.39 },
  "Georgia": { diesel: 3.79, gasoline: 3.19 },
  "Ohio": { diesel: 3.69, gasoline: 3.09 },
  "Pennsylvania": { diesel: 4.05, gasoline: 3.75 },
  "Nevada": { diesel: 4.29, gasoline: 4.19 },
};

type FuelPayload = {
  diesel: number;
  gasoline: number;
  updatedAt: string;
  scope: { state: string | null; city: string | null; lat: number | null; lon: number | null };
  dataSource: string;
};

const memoryCache = new Map<string, { data: FuelPayload; savedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function roundCoord(n: number, precision = 1) {
  const p = Math.pow(10, precision);
  return Math.round(n * p) / p;
}

function makeKey(opts: { state?: string; city?: string; lat?: number; lon?: number }) {
  if (typeof opts.lat === 'number' && typeof opts.lon === 'number') {
    const latB = roundCoord(opts.lat, 1);
    const lonB = roundCoord(opts.lon, 1);
    return `fuel:geo:${latB},${lonB}`;
  }
  return `fuel:${opts.state ?? 'USA'}:${opts.city ?? 'ALL'}`;
}

async function fetchWithRetry(params: { fuelType?: 'diesel' | 'regular'; lat?: number; lon?: number }, attempt = 1): Promise<any | null> {
  const MAX_ATTEMPTS = 2;
  const TIMEOUT_MS = 8000;
  try {
    console.log(`⛽ [Fuel API] Fetch attempt ${attempt}/${MAX_ATTEMPTS}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⏱️ [Fuel API] Timeout after ${TIMEOUT_MS}ms`);
      controller.abort();
    }, TIMEOUT_MS);
    try {
      const url = new URL(FUEL_API_URL);
      if (typeof params.lat === 'number' && typeof params.lon === 'number') {
        url.searchParams.set('lat', String(params.lat));
        url.searchParams.set('lon', String(params.lon));
      }
      if (params.fuelType) {
        url.searchParams.set('fuelType', params.fuelType);
      }

      console.log(`🔗 [Fuel API] Request URL: ${url.toString()}`);
      console.log(`🔑 [Fuel API] Using Bearer token: ${FUEL_API_KEY.substring(0, 10)}...`);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FUEL_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        console.warn(`⚠️ Fuel API error (attempt ${attempt}): ${res.status} ${res.statusText} :: ${body.substring(0, 200)}`);
        if (attempt < MAX_ATTEMPTS && (res.status >= 500 || res.status === 429 || res.status === 408 || res.status === 503)) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 6000);
          console.log(`⏳ [Fuel API] Retrying after ${delay}ms (status: ${res.status})...`);
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(params, attempt + 1);
        }
        return null;
      }
      const data = await res.json();
      console.log(`✅ [Fuel API] Data received successfully:`, JSON.stringify(data).substring(0, 300));
      return data;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (err) {
    const isAbortError = err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
    const isNetworkError = err instanceof Error && (
      err.message.includes('fetch') ||
      err.message.includes('network') ||
      err.message.includes('Failed to fetch')
    );
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`⚠️ Fuel API fetch failed (attempt ${attempt}):`, errorMsg);
    if (attempt < MAX_ATTEMPTS && (isAbortError || isNetworkError)) {
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 6000);
      console.log(`⏳ [Fuel API] Network/timeout error, retrying after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(params, attempt + 1);
    }
    return null;
  }
}

export const getFuelPricesRoute = publicProcedure
  .input(
    z.object({
      fuelType: z.enum(["diesel", "gasoline"]).optional().default("diesel"),
      state: z.string().optional(),
      city: z.string().optional(),
      lat: z.number().optional(),
      lon: z.number().optional(),
    })
  )
  .query(async ({ input }) => {
    const startTime = Date.now();
    const key = makeKey({ state: input.state, city: input.city, lat: input.lat, lon: input.lon });
    const cached = memoryCache.get(key);
    if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) {
      console.log(`🗄️ [Fuel API] Serve from memory cache in ${Date.now() - startTime}ms for ${key}`);
      const elapsed = Date.now() - startTime;
      console.log(`✅ [Fuel API] Response ready in ${elapsed}ms (source: memory_cache)`);
      return cached.data;
    }
    
    const getFallbackPayload = (): FuelPayload => {
      let dieselPrice = 3.59;
      let gasolinePrice = 3.45;
      let dataSource = 'national_default';
      
      if (input.state && FALLBACK_BY_STATE[input.state]) {
        const fb = FALLBACK_BY_STATE[input.state];
        dieselPrice = fb.diesel;
        gasolinePrice = fb.gasoline;
        dataSource = 'state_fallback';
      }
      
      return {
        diesel: dieselPrice,
        gasoline: gasolinePrice,
        updatedAt: new Date().toISOString(),
        scope: {
          state: input.state ?? null,
          city: input.city ?? null,
          lat: input.lat ?? null,
          lon: input.lon ?? null,
        },
        dataSource,
      };
    };
    
    try {
      console.log(`⛽ [Fuel API] Request: fuelType=${input.fuelType}, state=${input.state ?? 'none'}, city=${input.city ?? 'none'}, lat=${input.lat ?? 'none'}, lon=${input.lon ?? 'none'}`);
      console.log(`🔗 [Fuel API] URL: ${FUEL_API_URL}`);
      console.log(`🔑 [Fuel API] Key configured: ${FUEL_API_KEY ? 'Yes' : 'No'}`);
      let dieselPrice: number | null = null;
      let gasolinePrice: number | null = null;
      let dataSource = 'national_default';
      
      if (FUEL_API_KEY && FUEL_API_KEY !== '[YOUR_ACTUAL_API_KEY]') {
        const apiParams: { fuelType?: 'diesel' | 'regular'; lat?: number; lon?: number } = {};
        
        if (input.fuelType === 'diesel') {
          apiParams.fuelType = 'diesel';
        } else if (input.fuelType === 'gasoline') {
          apiParams.fuelType = 'regular';
        }
        
        if (typeof input.lat === 'number' && typeof input.lon === 'number') {
          apiParams.lat = input.lat;
          apiParams.lon = input.lon;
        }
        
        const data = await fetchWithRetry(apiParams);
        if (data) {
          console.log(`✅ [Fuel API] Data received, parsing...`);
          
          if (data.price && typeof data.price === 'number') {
            if (input.fuelType === 'diesel') {
              dieselPrice = Number(data.price.toFixed(2));
              gasolinePrice = Number((data.price * 1.05).toFixed(2));
            } else {
              gasolinePrice = Number(data.price.toFixed(2));
              dieselPrice = Number((data.price * 0.95).toFixed(2));
            }
            dataSource = 'live_api';
            console.log(`💰 [Fuel API] Price from API: ${data.price} (${input.fuelType})`);
          } else if (data.diesel || data.gasoline || data.regular) {
            dieselPrice = data.diesel ? Number(data.diesel.toFixed(2)) : null;
            gasolinePrice = data.gasoline || data.regular ? Number((data.gasoline || data.regular).toFixed(2)) : null;
            dataSource = 'live_api';
            console.log(`💰 [Fuel API] Prices from API: diesel=${dieselPrice}, gas=${gasolinePrice}`);
          } else if (Array.isArray(data.prices) && data.prices.length > 0) {
            const prices = data.prices;
            const dieselPrices = prices.filter((p: any) => p.fuelType === 'diesel').map((p: any) => p.price);
            const gasPrices = prices.filter((p: any) => p.fuelType === 'regular' || p.fuelType === 'gasoline').map((p: any) => p.price);
            
            if (dieselPrices.length > 0) {
              dieselPrice = Number((dieselPrices.reduce((a: number, b: number) => a + b, 0) / dieselPrices.length).toFixed(2));
            }
            if (gasPrices.length > 0) {
              gasolinePrice = Number((gasPrices.reduce((a: number, b: number) => a + b, 0) / gasPrices.length).toFixed(2));
            }
            dataSource = 'live_api';
            console.log(`💰 [Fuel API] Averaged prices: diesel=${dieselPrice}, gas=${gasolinePrice}`);
          }
        } else {
          console.warn(`⚠️ [Fuel API] No data returned from API`);
        }
      } else {
        console.warn(`⚠️ [Fuel API] No API key configured, using fallbacks`);
      }
      
      if ((dieselPrice === null || gasolinePrice === null) && input.state && FALLBACK_BY_STATE[input.state]) {
        const fb = FALLBACK_BY_STATE[input.state];
        dieselPrice = dieselPrice ?? fb.diesel;
        gasolinePrice = gasolinePrice ?? fb.gasoline;
        dataSource = 'state_fallback';
        console.log(`🔄 [Fuel API] Using state fallback for ${input.state}: diesel=${dieselPrice}, gas=${gasolinePrice}`);
      }
      if (dieselPrice === null) {
        dieselPrice = 3.59;
        dataSource = 'national_default';
      }
      if (gasolinePrice === null) {
        gasolinePrice = 3.45;
        dataSource = 'national_default';
      }
      const elapsed = Date.now() - startTime;
      console.log(`✅ [Fuel API] Response ready in ${elapsed}ms (source: ${dataSource})`);
      const payload: FuelPayload = {
        diesel: dieselPrice,
        gasoline: gasolinePrice,
        updatedAt: new Date().toISOString(),
        scope: {
          state: input.state ?? null,
          city: input.city ?? null,
          lat: input.lat ?? null,
          lon: input.lon ?? null,
        },
        dataSource,
      };
      memoryCache.set(key, { data: payload, savedAt: Date.now() });
      return payload;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [Fuel API] Error after ${elapsed}ms:`, error instanceof Error ? error.message : String(error));
      const cachedError = memoryCache.get(key);
      if (cachedError) {
        console.log('🗄️ [Fuel API] Serving stale cache on error');
        return cachedError.data;
      }
      const fallbackPayload = getFallbackPayload();
      fallbackPayload.dataSource = 'error_fallback';
      memoryCache.set(key, { data: fallbackPayload, savedAt: Date.now() });
      return fallbackPayload;
    }
  });

export default getFuelPricesRoute;
