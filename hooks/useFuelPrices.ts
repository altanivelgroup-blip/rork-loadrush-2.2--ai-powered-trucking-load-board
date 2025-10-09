import { useState, useEffect, useCallback } from 'react';

export function useFuelPrices(fuelType: 'diesel' | 'gasoline' = 'diesel') {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  const FUEL_API_URL = process.env.EXPO_PUBLIC_FUEL_API!;
  const FUEL_API_KEY = process.env.EXPO_PUBLIC_FUEL_KEY!;
  const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  const fetchFuelPrice = useCallback(async () => {
    try {
      console.log(`⛽ Fetching live ${fuelType} price from FuelPricesTracker`);
      setLoading(true);
      setError(null);

      if (!FUEL_API_URL || !FUEL_API_KEY) {
        throw new Error('Fuel API credentials not configured');
      }

      const response = await fetch(`${FUEL_API_URL}?fuel_type=${fuelType}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${FUEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid API key - please check your credentials');
        }
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Fuel API Response:", data);
      console.log("🧠 Raw JSON:", JSON.stringify(data, null, 2));

      const value = parseFloat(data?.price ?? data?.average ?? 0);
      if (!isNaN(value) && value > 0) {
        setPrice(value);
        setLastFetch(new Date());
      } else {
        setError('Invalid data received');
      }
    } catch (err) {
      console.error('❌ Fuel Sync Failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch fuel prices';
      setError(errorMessage);
      
      const fallbackPrice = fuelType === 'diesel' ? 3.89 : 3.45;
      setPrice(fallbackPrice);
      console.log(`⚠️ Using fallback price: ${fallbackPrice}/gal`);
    } finally {
      setLoading(false);
    }
  }, [fuelType, FUEL_API_URL, FUEL_API_KEY]);

  useEffect(() => {
    const shouldFetch = !lastFetch || Date.now() - lastFetch.getTime() > CACHE_DURATION;
    if (shouldFetch) fetchFuelPrice();

    const interval = setInterval(fetchFuelPrice, CACHE_DURATION);
    return () => clearInterval(interval);
  }, [fetchFuelPrice, lastFetch, CACHE_DURATION]);

  return { price, loading, error, lastFetch, refetch: fetchFuelPrice };
}
