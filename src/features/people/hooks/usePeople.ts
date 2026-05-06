import { useQuery } from '@tanstack/react-query';
import { peopleApi, PersonApiModel } from '@/features/people/api/people.api';

export function usePeople(campId: string | null | undefined) {
  return useQuery<PersonApiModel[]>({
    queryKey: ['people', campId],
    queryFn: () => peopleApi.getAllByCamp(campId!),
    enabled: !!campId,
    staleTime: 30_000,
    retry: 1,
  });
}
