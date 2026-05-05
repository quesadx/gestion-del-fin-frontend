import { api } from '@/shared/api/axiosInstance';

export interface SystemTimeResponse {
  now: string;
  iso: string;
  today: string;
}

export const systemApi = {
  getTime: () => api.get<SystemTimeResponse>('/system/time').then((r) => r.data),
};
