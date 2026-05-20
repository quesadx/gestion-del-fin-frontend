import { api } from '@/shared/api/axiosInstance';
import type { LoginRequest, LoginResponse } from '@/features/auth/types/auth.types';

export const authApi = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>('/auth/login', credentials).then((res) => res.data),
};
