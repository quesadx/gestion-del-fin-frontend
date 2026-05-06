import { api } from '@/shared/api/axiosInstance';

export interface CampApiModel {
  id: number;
  name: string;
  location?: string;
  status?: string;
  ai_context_prompt?: string;
}

export const campsApi = {
  getAll: () => api.get<CampApiModel[]>('/camps').then((response) => response.data),
  getById: (id: string) => api.get<CampApiModel>(`/camps/${id}`).then((response) => response.data),
};
