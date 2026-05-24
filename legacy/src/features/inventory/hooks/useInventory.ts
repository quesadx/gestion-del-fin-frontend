import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/features/inventory/api/inventory.api';
import type { ManualAdjustmentDto } from '@/features/inventory/api/inventory.api';
import type {
  InventoryItem,
  InventoryAuditEntry,
} from '@/features/inventory/types/inventory.types';

export function useInventory(campId: number) {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', campId] as const,
    queryFn: () => inventoryApi.getByCamp(campId),
    enabled: !!campId,
  });
}

export function useInventoryAudit(campId: number) {
  return useQuery<InventoryAuditEntry[]>({
    queryKey: ['inventory', campId, 'audit'] as const,
    queryFn: () => inventoryApi.getAuditByCamp(campId),
    enabled: !!campId,
  });
}

export function useCreateInventoryAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualAdjustmentDto) => inventoryApi.createAdjustment(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.camp_id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', variables.camp_id, 'audit'] });
    },
  });
}
