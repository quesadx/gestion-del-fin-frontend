import { api } from '@/shared/api/axiosInstance';
import type { User } from '../types/auth.types';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  user: {
    username: string;
    role?: User['role'];
    campId?: string;
    id?: string;
  };
  token: string;
}

export const authApi = {
  login: async ({ username, password }: LoginRequest): Promise<LoginResponse> => {
    return api.post<LoginResponse>('auth/login', { username, password }).then((res) => res.data);
  },

  verifySession: async (password: string): Promise<{ valid: boolean }> => {
    // Temporary simulation to get TypeScript to compile
    return { valid: password !== '' };
  },
};
