import { useQuery } from '@tanstack/react-query';
import { inventoryApi, InventoryItem } from '@/features/inventory/api/inventory.api';

export function useInventory(campId: string | null | undefined) {
  return useQuery<InventoryItem[]>({
    queryKey: ['inventory', campId],
    queryFn: () => inventoryApi.getByCamp(campId!),
    enabled: !!campId,
    staleTime: 30_000,
    retry: 1,
  });
}
