import { useCamps } from '@/features/camps/hooks/useCamps';
import { useResources } from '@/features/resources/hooks/useResources';
import type { Role } from '@/features/auth/types/auth.types';
import type { Camp } from '@/features/camps/types/camp.types';
import type { Resource } from '@/features/resources/types/resource.types';

export function useDashboardStats(role: Role | null, campId?: number) {
  const showStock = role === 'system_admin' || role === 'resource_manager' || role === 'worker';
  const showCamps = role === 'system_admin';
  const campsQuery = useCamps({
    enabled: showCamps,
  });
  const resourcesQuery = useResources({
    enabled: showStock,
  });

  const isLoading = (showCamps && campsQuery.isLoading) || (showStock && resourcesQuery.isLoading);

  const campsArray: Camp[] = campsQuery.data?.data ?? [];
  const resourcesArray: Resource[] = resourcesQuery.data ?? [];

  const autoDailyCount = resourcesArray.filter((r) => r.auto_daily === true).length;
  const activeCampName = campId ? campsArray.find((c) => c.id === campId)?.name : undefined;

  return {
    isLoading,
    camps: campsArray,
    resources: resourcesQuery.data,
    resourcesArray,
    campCount: showCamps ? campsArray.length : null,
    activeCamps: showCamps ? campsArray.filter((c) => c.status === 'ACTIVE').length : null,
    resourceCount: showStock ? resourcesArray.length : null,
    autoDailyCount: showStock ? autoDailyCount : null,
    activeCampName,
  };
}
