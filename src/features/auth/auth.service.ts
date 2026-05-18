import { authApi } from './api/auth.api';
import { useAuthStore } from './store/auth.store';
import type { LoginRequest } from '@/shared/api/types';
import type { AuthUser, Role } from './types/auth.types';

export type LoginPayload = LoginRequest;

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const { user, token } = await authApi.login(payload);
    const parts = token.split('.');
    const jwtPayload = parts.length === 3 ? JSON.parse(atob(parts[1])) : null;
    const role = jwtPayload?.role ?? null;
    const userId = jwtPayload?.userId ?? null;
    if (
      role &&
      ['system_admin', 'resource_manager', 'worker', 'travel_coordinator'].includes(role)
    ) {
      useAuthStore.getState().setSession({ user, token, role: role as Role, userId });
    } else {
      useAuthStore.getState().setSession({ user, token });
    }
    return user;
  },

  logout: async (): Promise<void> => {
    useAuthStore.getState().logout();
  },
};
