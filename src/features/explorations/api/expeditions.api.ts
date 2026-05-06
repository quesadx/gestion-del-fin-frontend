import { api } from '@/shared/api/axiosInstance';

export interface Expedition {
  id: string;
  destination?: string;
  leadSurvivor?: string;
  time?: string;
  status?: string;
  action?: string;
}

export const expeditionsApi = {
  getAll: () => api.get<Expedition[]>('/expeditions').then((r) => r.data),
};
