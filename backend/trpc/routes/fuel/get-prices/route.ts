import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const FUEL_API_URL = process.env.FUEL_API_URL || "https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs";
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
};

async function fetchWithRetry(attempt = 1): Promise<any | null> {
  const MAX_ATTEMPTS = 7;
  const TIMEOUT_MS = 30000;
  
  try {
    console.log(`⛽ [Fuel API] Fetch attempt ${attempt}/${MAX_ATTEMPTS}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`⏱️ [Fuel API] Timeout after ${TIMEOUT_MS}ms`);
      controller.abort();
    }, TIMEOUT_MS);
    
    try {
      const res = await fetch(FUEL_API_URL, {
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
        console.warn(`⚠️ Fuel API error (attempt ${attempt}): ${res.status} ${res.statusText} :: ${body.substring(0, 120)}`);
        
        if (attempt < MAX_ATTEMPTS && (res.status >= 500 || res.status === 429 || res.status === 408 || res.status === 503)) {
          const delay = Math.min(1500 * Math.pow(2, attempt - 1), 12000);
          console.log(`⏳ [Fuel API] Retrying after ${delay}ms (status: ${res.status})...`);
          await new Promise(r => setTimeout(r, delay));
          return fetchWithRetry(attempt + 1);
        }
        return null;
      }

      const data = await res.json();
      console.log(`✅ [Fuel API] Data received successfully`);
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
      const delay = Math.min(1500 * Math.pow(2, attempt - 1), 12000);
      console.log(`⏳ [Fuel API] Network/timeout error, retrying after ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(attempt + 1);
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
    })
  )
  .query(async ({ input }) => {
    const startTime = Date.now();
    try {
      console.log(`⛽ [Fuel API] Request: fuelType=${input.fuelType}, state=${input.state ?? 'none'}, city=${input.city ?? 'none'}`);
      console.log(`🔗 [Fuel API] URL: ${FUEL_API_URL}`);
      console.log(`🔑 [Fuel API] Key configured: ${FUEL_API_KEY ? 'Yes' : 'No'}`);

      let dieselPrice: number | null = null;
      let gasolinePrice: number | null = null;
      let dataSource = 'national_default';

      if (FUEL_API_KEY) {
        const data = await fetchWithRetry();
        if (data) {
          console.log(`✅ [Fuel API] Data received, parsing...`);
          const arr = data?.result || data?.data || data?.prices || [];
          if (Array.isArray(arr) && arr.length > 0) {
            console.log(`📊 [Fuel API] Found ${arr.length} price records`);
            let filtered = arr as any[];
            if (input.state) {
              filtered = filtered.filter((p) => String(p.state ?? p.region ?? '').toLowerCase() === input.state!.toLowerCase());
              console.log(`🔍 [Fuel API] Filtered by state "${input.state}": ${filtered.length} records`);
            }
            if (input.city) {
              filtered = filtered.filter((p) => String(p.city ?? '').toLowerCase() === input.city!.toLowerCase());
              console.log(`🔍 [Fuel API] Filtered by city "${input.city}": ${filtered.length} records`);
            }

            const dieselList = filtered
              .map((p) => Number(p.diesel ?? p.price_diesel ?? p.price))
              .filter((n) => Number.isFinite(n) && n > 0) as number[];
            const gasList = filtered
              .map((p) => Number(p.gasoline ?? p.price_gasoline ?? p.price))
              .filter((n) => Number.isFinite(n) && n > 0) as number[];

            if (dieselList.length > 0) {
              dieselPrice = Number((dieselList.reduce((a, b) => a + b, 0) / dieselList.length).toFixed(2));
              dataSource = 'live_api';
              console.log(`💰 [Fuel API] Diesel avg from ${dieselList.length} records: ${dieselPrice}`);
            }
            if (gasList.length > 0) {
              gasolinePrice = Number((gasList.reduce((a, b) => a + b, 0) / gasList.length).toFixed(2));
              dataSource = 'live_api';
              console.log(`💰 [Fuel API] Gasoline avg from ${gasList.length} records: ${gasolinePrice}`);
            }
          } else {
            const d = Number(data?.diesel ?? data?.average_diesel);
            const g = Number(data?.gasoline ?? data?.average_gasoline);
            dieselPrice = Number.isFinite(d) && d > 0 ? d : null;
            gasolinePrice = Number.isFinite(g) && g > 0 ? g : null;
            if (dieselPrice || gasolinePrice) {
              dataSource = 'live_api';
              console.log(`💰 [Fuel API] Direct prices: diesel=${dieselPrice}, gas=${gasolinePrice}`);
            }
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

      return {
        diesel: dieselPrice,
        gasoline: gasolinePrice,
        updatedAt: new Date().toISOString(),
        scope: {
          state: input.state ?? null,
          city: input.city ?? null,
        },
        dataSource,
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`❌ [Fuel API] Error after ${elapsed}ms:`, error instanceof Error ? error.message : String(error));
      return {
        diesel: 3.59,
        gasoline: 3.45,
        updatedAt: new Date().toISOString(),
        scope: {
          state: input.state ?? null,
          city: input.city ?? null,
        },
        dataSource: 'error_fallback',
      };
    }
  });

export default getFuelPricesRoute;
