import { publicProcedure } from "@/backend/trpc/create-context";
import { z } from "zod";

const FUEL_API_URL = process.env.EXPO_PUBLIC_FUEL_API || "https://api.fuelpricestracker.com/v1/prices";
const FUEL_API_KEY = process.env.EXPO_PUBLIC_FUEL_KEY || "10482|0Vh5MCrSC1OphlOuderbaNyQQWhTI7lpnpjpghTU";

export const getFuelPricesRoute = publicProcedure
  .input(
    z.object({
      fuelType: z.enum(["diesel", "gasoline"]).optional().default("diesel"),
    })
  )
  .query(async ({ input }) => {
    try {
      console.log(`⛽ Fetching ${input.fuelType} prices from FuelPricesTracker API`);

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

      const dieselPrice = parseFloat(data?.diesel ?? data?.average_diesel ?? 3.89);
      const gasolinePrice = parseFloat(data?.gasoline ?? data?.average_gasoline ?? 3.45);

      return {
        diesel: !isNaN(dieselPrice) && dieselPrice > 0 ? dieselPrice : 3.89,
        gasoline: !isNaN(gasolinePrice) && gasolinePrice > 0 ? gasolinePrice : 3.45,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Fuel price fetch failed:", error);
      
      return {
        diesel: 3.89,
        gasoline: 3.45,
        updatedAt: new Date().toISOString(),
      };
    }
  });

export default getFuelPricesRoute;
