import { api } from '@/shared/api/axiosInstance';
import type { PaginationQuery } from '@/shared/api/types';

export interface CreateResourceDto {
  name: string;
  unit: string;
  daily_ration: number;
  minimum_stock: number;
  auto_daily?: boolean;
}

export type UpdateResourceDto = Partial<CreateResourceDto>;

export const resourcesApi = {
  getAll: (query?: PaginationQuery) =>
    api.get('/resources', { params: query }).then((res) => res.data),
  getById: (id: number) => api.get(`/resources/${id}`).then((res) => res.data),
  create: (payload: CreateResourceDto) => api.post('/resources', payload).then((res) => res.data),
  update: (id: number, payload: UpdateResourceDto) =>
    api.put(`/resources/${id}`, payload).then((res) => res.data),
  remove: (id: number) => api.delete(`/resources/${id}`).then((res) => res.data),
};
