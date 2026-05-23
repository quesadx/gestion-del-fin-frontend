import { useCamps } from '@/features/camps/hooks/useCamps';
import { useResources } from '@/features/resources/hooks/useResources';
import { useInventory } from '@/features/inventory/hooks/useInventory';
import { usePeople } from '@/features/people/hooks/usePeople';
import { useExplorations } from '@/features/explorations/hooks/useExplorations';
import type { Role } from '@/features/auth/types/auth.types';
import type { Camp } from '@/features/camps/types/camp.types';
import type { Resource } from '@/features/resources/types/resource.types';
import type { InventoryItem } from '@/features/inventory/types/inventory.types';
import type { Exploration } from '@/features/explorations/types/exploration.types';

export function useDashboardStats(role: Role | null, campId?: number) {
  const showStock = role === 'system_admin' || role === 'resource_manager' || role === 'worker';
  const showCamps = role === 'system_admin';
  const showPerCamp = !!campId && (role === 'system_admin' || role === 'resource_manager');

  const campsQuery = useCamps({ enabled: showCamps });
  const resourcesQuery = useResources({ enabled: showStock });
  const inventoryQuery = useInventory(campId ?? 0);
  const peopleQuery = usePeople(campId ?? 0, { limit: 1 });
  const explorationsQuery = useExplorations();

  const campsArray: Camp[] = campsQuery.data?.data ?? [];
  const resourcesArray: Resource[] = resourcesQuery.data ?? [];
  const inventoryArray: InventoryItem[] = showPerCamp ? (inventoryQuery.data ?? []) : [];
  const peopleData = showPerCamp ? peopleQuery.data : null;
  const explorationsArray: Exploration[] = showPerCamp ? (explorationsQuery.data ?? []) : [];

  const isLoading =
    (showCamps && campsQuery.isLoading) ||
    (showStock && resourcesQuery.isLoading) ||
    (showPerCamp && inventoryQuery.isLoading);

  const autoDailyCount = resourcesArray.filter((r) => r.auto_daily === true).length;
  const activeCampName = campId ? campsArray.find((c) => c.id === campId)?.name : undefined;

  const peopleInCamp = peopleData
    ? ((peopleData as { pagination?: { total: number } }).pagination?.total ?? 0)
    : null;

  const inventoryItemCount = showPerCamp ? inventoryArray.length : null;

  const activeExplorationsInCamp = showPerCamp
    ? explorationsArray.filter((e) => e.camp_id === campId && e.status === 'ONGOING').length
    : null;

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
    peopleInCamp,
    inventoryItemCount,
    activeExplorationsInCamp,
  };
}
