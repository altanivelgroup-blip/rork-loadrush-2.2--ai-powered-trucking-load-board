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
  try {
    const res = await fetch(FUEL_API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${FUEL_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`⚠️ Fuel API error (attempt ${attempt}): ${res.status} ${res.statusText} :: ${body.substring(0, 120)}`);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 800 * attempt));
        return fetchWithRetry(attempt + 1);
      }
      return null;
    }

    return res.json();
  } catch (err) {
    console.warn(`⚠️ Fuel API fetch failed (attempt ${attempt}):`, err instanceof Error ? err.message : String(err));
    if (attempt < 3) {
      await new Promise(r => setTimeout(r, 800 * attempt));
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
    try {
      console.log(`⛽ Fetching prices (ft=${input.fuelType}, state=${input.state ?? '-'}, city=${input.city ?? '-'})`);
      console.log(`🔗 API URL: ${FUEL_API_URL}`);
      console.log(`🔑 API Key present: ${FUEL_API_KEY ? 'Yes' : 'No'}`);

      let dieselPrice: number | null = null;
      let gasolinePrice: number | null = null;

      if (FUEL_API_KEY) {
        const data = await fetchWithRetry();
        if (data) {
          const arr = data?.result || data?.data || data?.prices || [];
          if (Array.isArray(arr) && arr.length > 0) {
            let filtered = arr as Array<any>;
            if (input.state) {
              filtered = filtered.filter((p) => String(p.state ?? p.region ?? '').toLowerCase() === input.state!.toLowerCase());
            }
            if (input.city) {
              filtered = filtered.filter((p) => String(p.city ?? '').toLowerCase() === input.city!.toLowerCase());
            }

            const dieselList = filtered
              .map((p) => Number(p.diesel ?? p.price_diesel ?? p.price))
              .filter((n) => Number.isFinite(n) && n > 0) as number[];
            const gasList = filtered
              .map((p) => Number(p.gasoline ?? p.price_gasoline ?? p.price))
              .filter((n) => Number.isFinite(n) && n > 0) as number[];

            if (dieselList.length > 0) {
              dieselPrice = Number((dieselList.reduce((a, b) => a + b, 0) / dieselList.length).toFixed(2));
            }
            if (gasList.length > 0) {
              gasolinePrice = Number((gasList.reduce((a, b) => a + b, 0) / gasList.length).toFixed(2));
            }
          } else {
            const d = Number(data?.diesel ?? data?.average_diesel);
            const g = Number(data?.gasoline ?? data?.average_gasoline);
            dieselPrice = Number.isFinite(d) && d > 0 ? d : null;
            gasolinePrice = Number.isFinite(g) && g > 0 ? g : null;
          }
        }
      }

      if ((dieselPrice === null || gasolinePrice === null) && input.state && FALLBACK_BY_STATE[input.state]) {
        const fb = FALLBACK_BY_STATE[input.state];
        dieselPrice = dieselPrice ?? fb.diesel;
        gasolinePrice = gasolinePrice ?? fb.gasoline;
      }

      if (dieselPrice === null) dieselPrice = 3.59;
      if (gasolinePrice === null) gasolinePrice = 3.45;

      return {
        diesel: dieselPrice,
        gasoline: gasolinePrice,
        updatedAt: new Date().toISOString(),
        scope: {
          state: input.state ?? null,
          city: input.city ?? null,
        },
      };
    } catch (error) {
      console.error("❌ Fuel price fetch failed:", error);
      return {
        diesel: 3.59,
        gasoline: 3.45,
        updatedAt: new Date().toISOString(),
        scope: {
          state: input.state ?? null,
          city: input.city ?? null,
        },
      };
    }
  });

export default getFuelPricesRoute;
