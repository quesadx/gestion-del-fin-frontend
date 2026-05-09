import { api } from '@/shared/api/axiosInstance';

export type CampStatus = 'ACTIVE' | 'ABANDONED';

export interface CreateCampDto {
  name: string;
  location?: string;
  status?: CampStatus;
  ai_context_prompt?: string;
}

export type UpdateCampDto = Partial<CreateCampDto>;

export const campsApi = {
  getAll: () => api.get('/camps').then((res) => res.data),
  getById: (id: number) => api.get(`/camps/${id}`).then((res) => res.data),
  create: (payload: CreateCampDto) => api.post('/camps', payload).then((res) => res.data),
  update: (id: number, payload: UpdateCampDto) =>
    api.put(`/camps/${id}`, payload).then((res) => res.data),
  remove: (id: number) => api.delete(`/camps/${id}`).then((res) => res.data),
};
