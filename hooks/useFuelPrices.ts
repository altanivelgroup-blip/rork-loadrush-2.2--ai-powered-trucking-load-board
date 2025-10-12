import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';

export type FuelKind = 'diesel' | 'gasoline';

const FALLBACK_PRICES: Record<string, { diesel: number; gasoline: number }> = {
  'Illinois': { diesel: 3.99, gasoline: 3.79 },
  'Texas': { diesel: 3.49, gasoline: 2.99 },
  'California': { diesel: 5.09, gasoline: 5.39 },
  'Arizona': { diesel: 4.19, gasoline: 3.99 },
  'New York': { diesel: 4.25, gasoline: 3.89 },
  'Florida': { diesel: 3.85, gasoline: 3.39 },
  'Georgia': { diesel: 3.79, gasoline: 3.19 },
  'Ohio': { diesel: 3.69, gasoline: 3.09 },
  'Pennsylvania': { diesel: 4.05, gasoline: 3.75 },
};

const NATIONAL_AVERAGE = { diesel: 3.59, gasoline: 3.45 };

export function useFuelPrices(
  fuelType: FuelKind = 'diesel',
  opts?: { state?: string | null; city?: string | null; enabled?: boolean }
) {
  const state = opts?.state ?? undefined;
  const city = opts?.city ?? undefined;
  const enabled = opts?.enabled ?? true;
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const query = trpc.fuel.getPrices.useQuery(
    { fuelType, state, city },
    {
      enabled,
      staleTime: 30 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
      retry: 5,
      retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 10000),
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    }
  );

  useEffect(() => {
    if (query.data && !hasFetchedOnce) {
      setHasFetchedOnce(true);
      console.log('[useFuelPrices] ✅ First fetch successful:', {
        fuelType,
        state,
        city,
        price: fuelType === 'diesel' ? query.data.diesel : query.data.gasoline,
      });
    }
  }, [query.data, hasFetchedOnce, fuelType, state, city]);

  useEffect(() => {
    if (query.error) {
      console.warn('[useFuelPrices] ⚠️ Query error:', query.error.message);
      console.warn('[useFuelPrices] Using fallback prices for:', { state, city });
    }
  }, [query.error, state, city]);

  const getFallbackPrice = (): number => {
    if (state && FALLBACK_PRICES[state]) {
      return fuelType === 'diesel' ? FALLBACK_PRICES[state].diesel : FALLBACK_PRICES[state].gasoline;
    }
    return fuelType === 'diesel' ? NATIONAL_AVERAGE.diesel : NATIONAL_AVERAGE.gasoline;
  };

  const price = fuelType === 'diesel' ? query.data?.diesel : query.data?.gasoline;
  const finalPrice = price ?? getFallbackPrice();
  const lastFetch = query.data?.updatedAt ? new Date(query.data.updatedAt) : null;
  const isUsingFallback = !query.data || price === null || price === undefined;

  return {
    price: finalPrice,
    loading: query.isLoading && !hasFetchedOnce,
    error: query.error?.message ?? null,
    lastFetch,
    refetch: query.refetch,
    scope: query.data?.scope ?? { state: state ?? null, city: city ?? null },
    isUsingFallback,
  } as const;
}
