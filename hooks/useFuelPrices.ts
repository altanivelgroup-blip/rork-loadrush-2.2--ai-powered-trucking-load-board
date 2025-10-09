import { useState, useEffect, useCallback } from 'react';
import * as Location from 'expo-location';

export interface FuelPriceData {
  state: string;
  regular: string;
  midGrade: string;
  premium: string;
  diesel: string;
}

interface FuelPricesResponse {
  success: boolean;
  result: FuelPriceData[];
}

const FUEL_API_URL =
  process.env.EXPO_PUBLIC_FUEL_API || 'https://api.fuelpricestracker.com/fuel-costs';
const FUEL_API_KEY = process.env.EXPO_PUBLIC_FUEL_KEY || '';
const ORS_API_KEY = process.env.EXPO_PUBLIC_ORS_API || '';
const CACHE_DURATION = 6 * 60 * 60 * 1000;

// 🧭 Reverse-Geocode GPS → State
async function getStateFromGPS(): Promise<string | null> {
  try {
    const { coords } = await Location.getCurrentPositionAsync({});
    const url = `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${coords.longitude}&point.lat=${coords.latitude}`;
    const res = await fetch(url);
    const data = await res.json();
    const state =
      data.features?.[0]?.properties?.region ||
      data.features?.[0]?.properties?.state ||
      null;
    return state;
  } catch (err) {
    console.warn('⚠️ Reverse-geocode failed', err);
    return null;
  }
}

export function useFuelPrices(fuelType: 'diesel' | 'gasoline' = 'diesel') {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchFuelPrices = useCallback(async () => {
    const parsePrice = (value?: string): number | null => {
      if (!value) return null;
      const cleaned = value.replace('$', '').trim();
      const num = parseFloat(cleaned);
      return isNaN(num) ? null : num;
    };

    try {
      setLoading(true);
      setError(null);

      // 🌎 Step 1: get current state from GPS
      const currentState = await getStateFromGPS();
      console.log('📍 GPS detected state:', currentState);

      // 🌎 Step 2: Fetch price list
      const response = await fetch(FUEL_API_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${FUEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      const data: FuelPricesResponse = await response.json();

      if (!data.success || !data.result?.length)
        throw new Error('Invalid API response');

      let targetPrice: number | null = null;
      if (currentState) {
        const match = data.result.find(
          (item) => item.state.toLowerCase() === currentState.toLowerCase()
        );
        if (match) {
          const priceStr =
            fuelType === 'diesel'
              ? match.diesel
              : match.regular || match.midGrade || match.premium;
          targetPrice = parsePrice(priceStr);
          console.log(
            `✅ ${fuelType} price for ${currentState}: $${targetPrice?.toFixed(2)}`
          );
        } else {
          console.warn('⚠️ State not found, averaging all prices');
        }
      }

      if (targetPrice === null) {
        const all = data.result
          .map((i) =>
            parsePrice(fuelType === 'diesel' ? i.diesel : i.regular)
          )
          .filter((n): n is number => n !== null);
        targetPrice =
          all.reduce((sum, val) => sum + val, 0) / (all.length || 1);
        console.log(
          `⛽ Using national avg ${fuelType} price: $${targetPrice.toFixed(2)}`
        );
      }

      setPrice(targetPrice);
      setLastFetch(new Date());
      setLoading(false);
    } catch (err) {
      console.error('❌ Fuel Sync Failed:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch fuel prices'
      );
      setLoading(false);
    }
  }, [fuelType]);

  useEffect(() => {
    const shouldFetch =
      !lastFetch || Date.now() - lastFetch.getTime() > CACHE_DURATION;

    if (shouldFetch) fetchFuelPrices();
    const interval = setInterval(fetchFuelPrices, CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchFuelPrices, lastFetch]);

  return { price, loading, error, lastFetch, refetch: fetchFuelPrices };
}
