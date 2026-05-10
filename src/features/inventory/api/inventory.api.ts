import { api } from '@/shared/api/axiosInstance';

export type ManualAdjustmentType = 'MANUAL_IN' | 'MANUAL_OUT';

export interface ManualAdjustmentDto {
  camp_id: number;
  resource_type_id: number;
  type: ManualAdjustmentType;
  quantity: number;
  description?: string;
}

export const inventoryApi = {
  getByCamp: (campId: number) => api.get(`/inventory/${campId}`).then((res) => res.data.data),
  getAuditByCamp: (campId: number) =>
    api.get(`/inventory/audit/${campId}`).then((res) => res.data.data),
  createAdjustment: (payload: ManualAdjustmentDto) =>
    api.post('/inventory/adjustment', payload).then((res) => res.data),
};
