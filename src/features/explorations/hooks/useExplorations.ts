import { useQuery } from '@tanstack/react-query';
import { expeditionsApi, Expedition } from '@/features/explorations/api/expeditions.api';

export function useExplorations(campId: string | null | undefined) {
  return useQuery<Expedition[]>({
    queryKey: ['expeditions', campId],
    queryFn: () => expeditionsApi.getAll(),
    enabled: !!campId,
    staleTime: 30_000,
    retry: 1,
  });
}
