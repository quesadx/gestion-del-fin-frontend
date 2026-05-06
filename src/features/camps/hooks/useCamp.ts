import { useQuery } from '@tanstack/react-query';
import { campsApi, CampApiModel } from '@/features/camps/api/camps.api';

export function useCamp(campId: string | null | undefined) {
  return useQuery<CampApiModel>({
    queryKey: ['camp', campId],
    queryFn: () => campsApi.getById(campId!),
    enabled: !!campId,
    staleTime: 30_000,
    retry: 1,
  });
}
