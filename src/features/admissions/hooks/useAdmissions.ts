import { useQuery } from '@tanstack/react-query';
import { admissionsApi, Admission } from '@/features/admissions/api/admissions.api';

export function useAdmissions(campId: string | null | undefined) {
  return useQuery<Admission[]>({
    queryKey: ['admissions', campId],
    queryFn: () => admissionsApi.getByCamp(campId!),
    enabled: !!campId,
    staleTime: 30_000,
    retry: 1,
  });
}
