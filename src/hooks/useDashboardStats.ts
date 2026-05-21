import { useCamps } from '@/features/camps/hooks/useCamps';
import { useResources } from '@/features/resources/hooks/useResources';
import type { Role } from '@/features/auth/types/auth.types';
import type { Camp } from '@/features/camps/types/camp.types';
import type { Resource } from '@/features/resources/types/resource.types';

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

  const campsArray: Camp[] = campsQuery.data?.data ?? [];
  const resourcesArray: Resource[] = resourcesQuery.data ?? [];

  const autoDailyCount = resourcesArray.filter((r) => r.auto_daily === true).length;

  return {
    isLoading,
    camps: campsArray,
    resources: resourcesQuery.data,
    resourcesArray,
    campCount: role === 'system_admin' ? campsArray.length : null,
    activeCamps:
      role === 'system_admin' ? campsArray.filter((c) => c.status === 'ACTIVE').length : null,
    resourceCount: showStock ? resourcesArray.length : null,
    autoDailyCount: showStock ? autoDailyCount : null,
  };
}
