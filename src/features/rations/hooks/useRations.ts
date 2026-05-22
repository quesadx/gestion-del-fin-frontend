import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rationsApi } from '@/features/rations/api/rations.api';
import type { CreateRationDto } from '@/features/rations/types/ration.types';
import type { InventoryAuditEntry } from '@/features/inventory/types/inventory.types';

const RATIONS_KEY = (campId: number) => ['camps', campId, 'rations'] as const;

export function useRations(campId: number) {
  return useQuery<InventoryAuditEntry[]>({
    queryKey: RATIONS_KEY(campId),
    queryFn: () => rationsApi.getByCamp(campId),
    enabled: !!campId,
  });
}

export function useCreateRation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRationDto & { camp_id: number }) => rationsApi.create(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: RATIONS_KEY(variables.camp_id) });
    },
  });
}
