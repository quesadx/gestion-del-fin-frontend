import { api } from '@/shared/api/axiosInstance';
import type { PaginationQuery } from '@/shared/api/types';

export type PersonStatus = 'SICK' | 'HEALTHY' | 'INJURED' | 'AWAY' | 'DEAD';

export interface CreatePersonDto {
  full_name: string;
  camp_id: number;
  profession_id: number;
  admitted_at: string;
  status?: PersonStatus;
  age?: number;
  identification_code?: string;
  blood_type?: string;
  skills_summary?: string;
  photo_url?: string;
}

export type UpdatePersonDto = Partial<CreatePersonDto>;

export interface CreatePersonStatusLogDto {
  person_id: number;
  new_status: PersonStatus;
  reason?: string;
}

export interface CreateProfessionReassignmentDto {
  person_id: number;
  from_profession_id: number;
  to_profession_id: number;
  reason?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateContributionOverrideDto {
  person_id: number;
  resource_type_id: number;
  reason: string;
  amount: number;
  start_date?: string;
  end_date?: string;
}

export const peopleApi = {
  getAllByCamp: (campId: number, query?: PaginationQuery) =>
    api.get(`/camps/${campId}/people`, { params: query }).then((res) => res.data.data),
  getById: (campId: number, id: number) =>
    api.get(`/camps/${campId}/people/${id}`).then((res) => res.data),
  create: (campId: number, payload: CreatePersonDto) =>
    api.post(`/camps/${campId}/people`, payload).then((res) => res.data),
  update: (campId: number, id: number, payload: UpdatePersonDto) =>
    api.put(`/camps/${campId}/people/${id}`, payload).then((res) => res.data),
  remove: (campId: number, id: number) =>
    api.delete(`/camps/${campId}/people/${id}`).then((res) => res.data),
  addStatusLog: (campId: number, payload: CreatePersonStatusLogDto) =>
    api.post(`/camps/${campId}/people/status-log`, payload).then((res) => res.data),
  createProfessionReassignment: (campId: number, payload: CreateProfessionReassignmentDto) =>
    api.post(`/camps/${campId}/people/profession-reassignments`, payload).then((res) => res.data),
  createContributionOverride: (campId: number, payload: CreateContributionOverrideDto) =>
    api.post(`/camps/${campId}/people/contribution-overrides`, payload).then((res) => res.data),
};
