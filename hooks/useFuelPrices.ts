import { useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const CACHE_TTL_MS = 5 * 60 * 1000;

export function useFuelPrices(
  fuelType: FuelKind = 'diesel',
  opts?: { state?: string | null; city?: string | null; enabled?: boolean }
) {
  const state = opts?.state ?? undefined;
  const city = opts?.city ?? undefined;
  const enabled = opts?.enabled ?? true;
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);
  const [initialFromCache, setInitialFromCache] = useState<boolean>(false);
  const queryClient = useQueryClient();

  const input = useMemo(() => ({ fuelType, state, city }), [fuelType, state, city]);
  const cacheKey = useMemo(() => `fuel:${fuelType}:${state ?? 'USA'}:${city ?? 'ALL'}`, [fuelType, state, city]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(cacheKey);
        if (!raw) return;
        const parsed = JSON.parse(raw) as { data: any; savedAt: number } | null;
        if (!parsed?.data || !parsed.savedAt) return;
        const age = Date.now() - parsed.savedAt;
        if (age < CACHE_TTL_MS && isMounted) {
          const key = trpc.fuel.getPrices.getQueryKey(input);
          queryClient.setQueryData(key, parsed.data);
          setInitialFromCache(true);
          console.log('[useFuelPrices] 🗄️ Served from cache instantly', { cacheKey, ageMs: age });
        }
      } catch (e) {
        console.warn('[useFuelPrices] Cache read error', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [cacheKey, input, queryClient]);

  const query = trpc.fuel.getPrices.useQuery(input, {
    enabled,
    staleTime: CACHE_TTL_MS,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 3,
    retryDelay: (attempt) => Math.min(750 * Math.pow(2, attempt), 5000),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'always',
    keepPreviousData: true,
  });

  useEffect(() => {
    if (query.data) {
      setHasFetchedOnce(true);
      (async () => {
        try {
          await AsyncStorage.setItem(cacheKey, JSON.stringify({ data: query.data, savedAt: Date.now() }));
          console.log('[useFuelPrices] 💾 Cached fresh data', { cacheKey });
        } catch (e) {
          console.warn('[useFuelPrices] Cache write error', e);
        }
      })();
      if (!initialFromCache) {
        console.log('[useFuelPrices] ✅ First live fetch successful:', {
          fuelType,
          state,
          city,
          price: fuelType === 'diesel' ? query.data.diesel : query.data.gasoline,
        });
      }
    }
  }, [query.data, cacheKey, initialFromCache, fuelType, state, city]);

  useEffect(() => {
    if (query.error) {
      console.warn('[useFuelPrices] ⚠️ Query error:', query.error.message);
    }
  }, [query.error]);

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
    loading: !initialFromCache && query.isLoading && !hasFetchedOnce,
    error: query.error?.message ?? null,
    lastFetch,
    refetch: query.refetch,
    scope: query.data?.scope ?? { state: state ?? null, city: city ?? null },
    isUsingFallback,
  } as const;
}
