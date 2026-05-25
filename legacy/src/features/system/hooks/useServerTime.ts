import { useQuery } from '@tanstack/react-query';
import { systemApi } from '@/features/system/api/system.api';
import { queryClient } from '@/shared/lib/queryClient';
import type { SystemTimeResponse } from '@/shared/api/types';

const SYSTEM_TIME_KEY = ['system-time'] as const;

export function useServerTime() {
  return useQuery<SystemTimeResponse>({
    queryKey: SYSTEM_TIME_KEY,
    queryFn: systemApi.getTime,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

export function getServerNow(): number {
  const state = queryClient.getQueryState<SystemTimeResponse>(SYSTEM_TIME_KEY);
  const data = state?.data;
  if (!data || !state?.dataUpdatedAt) return Date.now();
  const serverTimestamp = Number(data.now) || Date.parse(data.now);
  return serverTimestamp + (Date.now() - state.dataUpdatedAt);
}
