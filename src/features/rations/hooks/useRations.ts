import { useQuery } from '@tanstack/react-query';
import { rationsApi } from '@/features/rations/api/rations.api';
import type { InventoryAuditEntry } from '@/features/inventory/types/inventory.types';

const RATIONS_KEY = (campId: number) => ['camps', campId, 'rations'] as const;

export function useRations(campId: number) {
  return useQuery<InventoryAuditEntry[]>({
    queryKey: RATIONS_KEY(campId),
    queryFn: () => rationsApi.getByCamp(campId),
    enabled: !!campId,
  });
}
