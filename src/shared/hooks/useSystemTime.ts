import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/shared/api/system.api';

export function useSystemTime() {
  return useQuery({
    queryKey: ['system', 'time'],
    queryFn: systemApi.getTime,
    staleTime: 30_000,
    retry: 1,
  });
}
