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
const FUEL_API_KEY_RAW = process.env.EXPO_PUBLIC_COLLECTAPI_KEY || '3h76TGQbMdx0Tsny6kjteC:1Yfg3B0w4EkadHza3kUGH6';
const FUEL_API_KEY = FUEL_API_KEY_RAW.startsWith('apikey ') ? FUEL_API_KEY_RAW : `apikey ${FUEL_API_KEY_RAW}`;
const CACHE_DURATION = 6 * 60 * 60 * 1000;

export function useFuelPrices(driverState?: string, fuelType: 'diesel' | 'gasoline' = 'diesel') {
  const [dieselPrice, setDieselPrice] = useState<number | null>(null);
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
      console.log(`⛽ Fuel Sync Active - Fetching ${fuelType} prices from CollectAPI`);
      console.log(`🔑 Using API Key: ${FUEL_API_KEY.substring(0, 15)}...`);
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
      console.log(`🔍 Looking for state: "${driverState || 'N/A'}"`);

      let targetPrice: number | null = null;
      let matchedState: string | null = null;

      if (driverState) {
        const stateData = data.result.find(
          (item) => item.state.toLowerCase() === driverState.toLowerCase()
        );

        if (stateData) {
          const priceString = fuelType === 'diesel' ? stateData.diesel : stateData.gasoline;
          const parsedPrice = parsePrice(priceString);
          
          if (parsedPrice === null) {
            console.warn(`⚠️ Invalid fuel data for state:`, driverState, stateData);
            const allPrices = data.result
              .map((item) => {
                const priceStr = fuelType === 'diesel' ? item.diesel : item.gasoline;
                return parsePrice(priceStr);
              })
              .filter((price): price is number => price !== null);
            
            if (allPrices.length > 0) {
              targetPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
              console.log(`⛽ Using U.S. average ${fuelType} price: $${targetPrice.toFixed(2)}`);
            }
          } else {
            targetPrice = parsedPrice;
            matchedState = stateData.state;
            console.log(`✅ State match found: ${matchedState}`);
            console.log(`⛽ ${fuelType.charAt(0).toUpperCase() + fuelType.slice(1)} price for ${matchedState}: $${targetPrice.toFixed(2)}`);
          }
        } else {
          console.warn(`⚠️ State "${driverState}" not found in API response`);
          console.log(`📋 Available states (first 10): ${data.result.map(s => s.state).slice(0, 10).join(', ')}`);
          console.log(`📋 Total states fetched: ${data.result.length}`);
          const allPrices = data.result
            .map((item) => {
              const priceString = fuelType === 'diesel' ? item.diesel : item.gasoline;
              return parsePrice(priceString);
            })
            .filter((price): price is number => price !== null);
          
          if (allPrices.length > 0) {
            targetPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
            console.log(`⛽ Using U.S. average ${fuelType} price: $${targetPrice.toFixed(2)}`);
          }
        }
      } else {
        console.log(`ℹ️ No driver state specified, calculating U.S. average`);
        const allPrices = data.result
          .map((item) => {
            const priceString = fuelType === 'diesel' ? item.diesel : item.gasoline;
            return parsePrice(priceString);
          })
          .filter((price): price is number => price !== null);
        
        if (allPrices.length > 0) {
          targetPrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
          console.log(`⛽ U.S. average ${fuelType} price: $${targetPrice.toFixed(2)}`);
        }
      }

      setDieselPrice(targetPrice);
      setLastFetch(new Date());
      setLoading(false);
    } catch (err) {
      console.error('❌ Fuel Sync Failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch fuel prices');
      setLoading(false);
    }
  }, [driverState, fuelType]);

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
