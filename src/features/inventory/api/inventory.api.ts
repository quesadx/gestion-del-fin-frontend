import { api } from '@/shared/api/axiosInstance';

export interface InventoryItem {
  id: string;
  name: string;
  category?: string;
  quantity: number;
  unit: string;
  minThreshold?: number;
}

function unwrapInventoryResponse(value: unknown): InventoryItem[] {
  if (Array.isArray(value)) {
    return value as InventoryItem[];
  }

  if (typeof value === 'object' && value !== null) {
    const wrapper = value as Record<string, unknown>;
    if (Array.isArray(wrapper.data)) {
      return wrapper.data as InventoryItem[];
    }
    if (Array.isArray(wrapper.items)) {
      return wrapper.items as InventoryItem[];
    }
    if (Array.isArray(wrapper.inventory)) {
      return wrapper.inventory as InventoryItem[];
    }
  }

  throw new Error('Unexpected inventory response format');
}

export const inventoryApi = {
  getByCamp: async (campId: string) => {
    const response = await api.get<unknown>(`/inventory/${campId}`);
    return unwrapInventoryResponse(response.data);
  },
};
