import { api } from '@/shared/api/axiosInstance';

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
}

export const inventoryApi = {
  getByCamp: (campId: string) => api.get<InventoryItem[]>(`/inventory/${campId}`).then((response) => response.data),
};
