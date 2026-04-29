import { api } from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/lib/api.types';
import type { User } from '../types/auth.types';

export const authApi = {
  login: async (credentials: { username: string; password: string }) => {
    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>(
        '/auth/login',
        credentials,
      );

      return response.data.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      return Promise.reject(error);
    }
  },

  verifySession: async (password: string): Promise<{ valid: boolean }> => {
    try {
      const response = await api.post<ApiResponse<{ valid: boolean }>>(
        '/auth/verify-session',
        { password },
      );

      return response.data.data;
    } catch (error) {
      return Promise.reject(error);
    }
  },
};
