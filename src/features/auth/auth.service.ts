import { authApi } from './api/auth.api';
import { useAuthStore } from './store/auth.store';
import type { LoginRequest } from '@/shared/api/types';
import type { AuthUser } from './types/auth.types';

export type LoginPayload = LoginRequest;

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const { user, token } = await authApi.login(payload);
    useAuthStore.getState().setSession({ user, token });
    return user;
  },

  logout: async (): Promise<void> => {
    useAuthStore.getState().logout();
  },
};
