import { useState, useEffect, useCallback } from 'react';

export interface FuelPriceData {
  state: string;
  gasoline: string;
  midGrade: string;
  premium: string;
  diesel: string;
}

interface FuelPricesResponse {
  success: boolean;
  result: FuelPriceData[];
}

const FUEL_API_URL = process.env.EXPO_PUBLIC_COLLECTAPI_URL || 'https://api.collectapi.com/gasPrice/allUsaPrice';
const FUEL_API_KEY = process.env.EXPO_PUBLIC_COLLECTAPI_KEY || 'apikey 3h76TGQbMdx0Tsny6kjteC:1Yfg3B0w4EkadHza3kUGH6';
const CACHE_DURATION = 6 * 60 * 60 * 1000;

export function useFuelPrices(driverState?: string) {
  const [dieselPrice, setDieselPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const fetchFuelPrices = useCallback(async () => {
    try {
      console.log('⛽ Fuel Sync Active - Fetching prices from CollectAPI');
      setLoading(true);
      setError(null);

      const response = await fetch(FUEL_API_URL, {
        method: 'GET',
        headers: {
          'authorization': FUEL_API_KEY,
          'content-type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data: FuelPricesResponse = await response.json();

      if (!data.success || !data.result || data.result.length === 0) {
        throw new Error('Invalid API response format');
      }

      console.log(`✅ Fuel Sync Success - Received data for ${data.result.length} states`);

      let targetPrice: number;

      if (driverState) {
        const stateData = data.result.find(
          (item) => item.state.toLowerCase() === driverState.toLowerCase()
        );

        if (stateData) {
          targetPrice = parseFloat(stateData.diesel.replace('$', ''));
          console.log(`⛽ Diesel price for ${driverState}: $${targetPrice.toFixed(2)}`);
        } else {
          console.warn(`⚠️ State "${driverState}" not found, calculating average`);
          const allPrices = data.result
            .map((item) => parseFloat(item.diesel.replace('$', '')))
            .filter((price) => !isNaN(price));
          targetPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
          console.log(`⛽ Average diesel price across all states: $${targetPrice.toFixed(2)}`);
        }
      } else {
        const allPrices = data.result
          .map((item) => parseFloat(item.diesel.replace('$', '')))
          .filter((price) => !isNaN(price));
        targetPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
        console.log(`⛽ Average diesel price (no state specified): $${targetPrice.toFixed(2)}`);
      }

      setDieselPrice(targetPrice);
      setLastFetch(new Date());
      setLoading(false);
    } catch (err) {
      console.error('❌ Fuel Sync Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch fuel prices');
      setLoading(false);
    }
  }, [driverState]);

  useEffect(() => {
    const shouldFetch = !lastFetch || Date.now() - lastFetch.getTime() > CACHE_DURATION;

    if (shouldFetch) {
      fetchFuelPrices();
    }

    const interval = setInterval(() => {
      fetchFuelPrices();
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchFuelPrices, lastFetch]);

  return {
    dieselPrice,
    loading,
    error,
    lastFetch,
    refetch: fetchFuelPrices,
  };
}
