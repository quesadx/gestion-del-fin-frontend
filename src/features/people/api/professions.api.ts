import { api } from '@/shared/api/axiosInstance';

export interface CreateProfessionDto {
  name: string;
  description?: string;
}

export type UpdateProfessionDto = Partial<CreateProfessionDto>;

export const professionsApi = {
  getAll: () => api.get('/professions').then((res) => res.data),
  getById: (id: number) => api.get(`/professions/${id}`).then((res) => res.data),
  create: (payload: CreateProfessionDto) =>
    api.post('/professions', payload).then((res) => res.data),
  update: (id: number, payload: UpdateProfessionDto) =>
    api.put(`/professions/${id}`, payload).then((res) => res.data),
  remove: (id: number) => api.delete(`/professions/${id}`).then((res) => res.data),
};
