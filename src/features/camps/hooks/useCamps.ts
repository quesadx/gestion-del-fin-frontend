import { useQuery } from '@tanstack/react-query';
import { campsApi, CampApiModel } from '@/features/camps/api/camps.api';

export function useCamps() {
  return useQuery<CampApiModel[]>({
    queryKey: ['camps'],
    queryFn: campsApi.getAll,
    staleTime: 30_000,
    retry: 1,
  });
}
