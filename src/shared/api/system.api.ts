import { api } from '@/shared/api/axiosInstance';
import type { SystemTimeResponse } from '@/shared/api/types';

export const systemApi = {
  getTime: () => api.get<SystemTimeResponse>('/system/time').then((res) => res.data),
};
