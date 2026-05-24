import { api } from '@/shared/api/axiosInstance';
import type { PersonStatus } from '@/shared/api/types';

export type ExpeditionStatus = 'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED';

export interface ResourceAllocation {
  resource_type_id: number;
  amount: number;
}

export interface ExplorationMember {
  person_id: number;
}

export interface CreateExplorationDto {
  camp_id: number;
  created_by: number;
  destination: string;
  departure_date: string;
  expected_return_date: string;
  max_return_date: string;
  actual_return_date?: string;
  status?: ExpeditionStatus;
  notes?: string;
  members?: ExplorationMember[];
  allocated_resources?: ResourceAllocation[];
}

export type UpdateExplorationDto = Partial<Omit<CreateExplorationDto, 'status'>>;

export interface UpdateExplorationStatusDto {
  status: ExpeditionStatus;
  actual_return_date?: string;
  notes?: string;
  changed_by: number;
  resources_to_return?: ResourceAllocation[];
  members?: ExplorationMember[];
  return_member_status?: PersonStatus;
}

export interface DeleteExplorationDto {
  changed_by: number;
  return_member_status?: PersonStatus;
}

export const explorationsApi = {
  getAll: () => api.get('/expeditions').then((res) => res.data.data),
  getById: (id: number) => api.get(`/expeditions/${id}`).then((res) => res.data),
  create: (payload: CreateExplorationDto) =>
    api.post('/expeditions', payload).then((res) => res.data),
  update: (id: number, payload: UpdateExplorationDto) =>
    api.put(`/expeditions/${id}`, payload).then((res) => res.data),
  updateStatus: (id: number, payload: UpdateExplorationStatusDto) =>
    api.patch(`/expeditions/${id}/status`, payload).then((res) => res.data),
  remove: (id: number, payload: DeleteExplorationDto) =>
    api.delete(`/expeditions/${id}`, { data: payload }).then((res) => res.data),
};
