import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/features/system/api/system.api';

const SYSTEM_TIME_KEY = ['system-time'] as const;

export function useServerTime() {
  return useQuery({
    queryKey: SYSTEM_TIME_KEY,
    queryFn: systemApi.getTime,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}
