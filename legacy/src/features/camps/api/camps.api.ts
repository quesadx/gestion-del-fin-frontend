import { api } from '@/shared/api/axiosInstance';
import type { PaginationQuery } from '@/shared/api/types';
import type { CampStatus } from '@/features/camps/types/camp.types';

export interface CreateCampDto {
  name: string;
  location?: string;
  status?: CampStatus;
  ai_context_prompt?: string;
}

export type UpdateCampDto = Partial<CreateCampDto>;

export const campsApi = {
  getAll: (query?: PaginationQuery) => api.get('/camps', { params: query }).then((res) => res.data),
  getById: (id: number) => api.get(`/camps/${id}`).then((res) => res.data),
  create: (payload: CreateCampDto) => api.post('/camps', payload).then((res) => res.data),
  update: (id: number, payload: UpdateCampDto) =>
    api.put(`/camps/${id}`, payload).then((res) => res.data),
  remove: (id: number) => api.delete(`/camps/${id}`).then((res) => res.data),
};
