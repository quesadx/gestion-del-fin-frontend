import { api } from '@/shared/api/axiosInstance';

export interface CreateUserDto {
  username: string;
  password: string;
  camp_id: number;
  role_id: number;
  is_active?: boolean;
  last_activity?: string;
  created_at?: string;
}

export type UpdateUserDto = Partial<CreateUserDto>;

export interface RoleItem {
  id: number;
  name: string;
}

export const usersApi = {
  getAll: () => api.get('/users').then((res) => res.data.data),
  getById: (id: number) => api.get(`/users/${id}`).then((res) => res.data),
  getRoles: () => api.get('/users/roles').then((res) => res.data),
  create: (payload: CreateUserDto) => api.post('/users', payload).then((res) => res.data),
  update: (id: number, payload: UpdateUserDto) =>
    api.put(`/users/${id}`, payload).then((res) => res.data),
  remove: (id: number) => api.delete(`/users/${id}`).then((res) => res.data),
};
