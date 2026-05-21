import { useCamps } from '@/features/camps/hooks/useCamps';
import { useResources } from '@/features/resources/hooks/useResources';
import type { Role } from '@/features/auth/types/auth.types';

export function useDashboardStats(role: Role | null) {
  const showStock = role === 'system_admin' || role === 'resource_manager';
  const campsQuery = useCamps({
    enabled: role === 'system_admin',
  });
  const resourcesQuery = useResources({
    enabled: showStock,
  });

  const isLoading =
    (role === 'system_admin' && campsQuery.isLoading) || (showStock && resourcesQuery.isLoading);

  const campsData = (campsQuery.data as Record<string, unknown>)?.data as
    | Record<string, unknown>[]
    | undefined;
  const campsArray = Array.isArray(campsData) ? campsData : [];
  const resourcesData = (resourcesQuery.data as Record<string, unknown>)?.data as
    | Record<string, unknown>[]
    | undefined;
  const resourcesArray = Array.isArray(resourcesData) ? resourcesData : [];

  const autoDailyCount = resourcesArray.filter(
    (r: Record<string, unknown>) => r.auto_daily === true,
  ).length;

  return {
    isLoading,
    camps: campsArray,
    resources: resourcesQuery.data,
    resourcesArray,
    campCount: role === 'system_admin' ? campsArray.length : null,
    activeCamps:
      role === 'system_admin'
        ? campsArray.filter((c: Record<string, unknown>) => c.status === 'ACTIVE').length
        : null,
    resourceCount: showStock ? resourcesArray.length : null,
    autoDailyCount: showStock ? autoDailyCount : null,
  };
}
