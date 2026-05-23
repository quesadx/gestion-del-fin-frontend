import { api } from '@/shared/api/axiosInstance';
import { RATION_DESC_PREFIX } from '@/features/rations/types/ration.types';
import type { InventoryAuditEntry } from '@/features/inventory/types/inventory.types';

export const rationsApi = {
  getByCamp: (campId: number) =>
    api.get(`/inventory/audit/${campId}`).then((res) => {
      const data = res.data.data ?? res.data ?? [];
      const arr = Array.isArray(data) ? (data as InventoryAuditEntry[]) : [];
      return arr.filter(
        (entry) =>
          (entry.type === 'MANUAL_OUT' || entry.log_type === 'MANUAL_OUT') &&
          typeof entry.description === 'string' &&
          entry.description.startsWith(RATION_DESC_PREFIX),
      );
    }),
};
