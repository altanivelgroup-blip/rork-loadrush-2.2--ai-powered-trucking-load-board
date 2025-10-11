import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const FUEL_API_URL = process.env.FUEL_API_URL || "https://zylalabs.com/api/7700/fuel+prices+tracker+api/12475/fuel+costs";
const FUEL_API_KEY = process.env.FUEL_API_KEY || "";

if (!FUEL_API_KEY) {
  console.warn("⚠️ FUEL_API_KEY not set in environment variables");
}

export const getFuelPricesRoute = publicProcedure
  .input(
    z.object({
      fuelType: z.enum(["diesel", "gasoline"]).optional().default("diesel"),
    })
  )
  .query(async ({ input }) => {
    try {
      console.log(`⛽ Fetching ${input.fuelType} prices from Zyla Fuel API`);
      console.log(`🔗 API URL: ${FUEL_API_URL}`);
      console.log(`🔑 API Key present: ${FUEL_API_KEY ? 'Yes' : 'No'}`);

      const response = await fetch(FUEL_API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FUEL_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      console.log(`📡 Fuel API Response Status: ${response.status}`);

      if (!response.ok) {
        console.error(`❌ Fuel API Error: ${response.status} ${response.statusText}`);
        throw new Error(`Fuel API returned ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Fuel API Data received:", JSON.stringify(data).substring(0, 200));

      const dieselPrice = parseFloat(data?.diesel ?? data?.average_diesel ?? 3.59);
      const gasolinePrice = parseFloat(data?.gasoline ?? data?.average_gasoline ?? 3.45);

      return {
        diesel: !isNaN(dieselPrice) && dieselPrice > 0 ? dieselPrice : 3.59,
        gasoline: !isNaN(gasolinePrice) && gasolinePrice > 0 ? gasolinePrice : 3.45,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Fuel price fetch failed:", error);
      
      return {
        diesel: 3.59,
        gasoline: 3.45,
        updatedAt: new Date().toISOString(),
      };
    }
  });

export default getFuelPricesRoute;
