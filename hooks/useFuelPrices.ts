import { trpc } from '@/lib/trpc';

export function useFuelPrices(fuelType: 'diesel' | 'gasoline' = 'diesel') {
  const { data, isLoading, error, refetch } = trpc.fuel.getPrices.useQuery(
    { fuelType },
    {
      staleTime: 6 * 60 * 60 * 1000,
      refetchInterval: 6 * 60 * 60 * 1000,
    }
  );

  const price = fuelType === 'diesel' ? data?.diesel : data?.gasoline;
  const lastFetch = data?.updatedAt ? new Date(data.updatedAt) : null;

  return {
    price: price ?? null,
    loading: isLoading,
    error: error?.message ?? null,
    lastFetch,
    refetch,
  };
}
