import { api } from '@/shared/api/axiosInstance';
import type { CreateRationDto } from '@/features/rations/types/ration.types';
import { RATION_DESC_PREFIX } from '@/features/rations/types/ration.types';

export const rationsApi = {
  getByCamp: (campId: number) =>
    api.get(`/inventory/audit/${campId}`).then((res) => {
      const data = res.data.data ?? res.data ?? [];
      const arr = Array.isArray(data) ? data : [];
      return arr.filter(
        (entry: Record<string, unknown>) =>
          (entry.type === 'MANUAL_OUT' || entry.log_type === 'MANUAL_OUT') &&
          typeof entry.description === 'string' &&
          entry.description.startsWith(RATION_DESC_PREFIX),
      );
    }),

  create: (payload: CreateRationDto & { camp_id: number }) => {
    const descParts = [
      `${RATION_DESC_PREFIX} person=${payload.person_id}`,
      `resource=${payload.resource_type_id}`,
      `consumed_at=${payload.consumed_at}`,
    ];
    if (payload.notes) descParts.push(`notes=${payload.notes}`);

    return api
      .post('/inventory/adjustment', {
        camp_id: payload.camp_id,
        resource_type_id: payload.resource_type_id,
        type: 'MANUAL_OUT',
        quantity: payload.quantity,
        description: descParts.join(' '),
      })
      .then((res) => res.data);
  },
};
