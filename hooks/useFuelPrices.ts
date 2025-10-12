import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export type FuelKind = 'diesel' | 'gasoline';

export function useFuelPrices(
  fuelType: FuelKind = 'diesel',
  opts?: { state?: string | null; city?: string | null; enabled?: boolean }
) {
  const state = opts?.state ?? undefined;
  const city = opts?.city ?? undefined;
  const enabled = opts?.enabled ?? true;

  const query = trpc.fuel.getPrices.useQuery(
    { fuelType, state, city },
    {
      enabled,
      staleTime: 30 * 60 * 1000,
      refetchInterval: 10 * 60 * 1000,
      retry: 3,
      retryDelay: (attempt) => Math.min(2000 * attempt, 6000),
    }
  );

  useEffect(() => {
    if (query.error) {
      console.warn('[useFuelPrices] Query error:', query.error.message);
    }
  }, [query.error]);

  const price = fuelType === 'diesel' ? query.data?.diesel : query.data?.gasoline;
  const lastFetch = query.data?.updatedAt ? new Date(query.data.updatedAt) : null;

  return {
    price: price ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    lastFetch,
    refetch: query.refetch,
    scope: query.data?.scope ?? { state: state ?? null, city: city ?? null },
  } as const;
}
