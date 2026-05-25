import { api } from '@/shared/api/axiosInstance';

export const systemApi = {
  getTime: () => api.get('/system/time').then((res) => res.data),
};
