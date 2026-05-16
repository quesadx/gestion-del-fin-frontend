import { authApi } from './api/auth.api';
import { useAuthStore } from './store/auth.store';
import type { LoginRequest } from '@/shared/api/types';
import type { AuthUser, Role } from './types/auth.types';

export type LoginPayload = LoginRequest;

function decodeRoleFromToken(token: string): Role | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    const role: string = payload.role ?? '';
    if (!role) return null;
    if (['system_admin', 'resource_manager', 'worker', 'travel_coordinator'].includes(role)) {
      return role as Role;
    }
    return null;
  } catch {
    return null;
  }
}

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const { user, token } = await authApi.login(payload);
    const role = decodeRoleFromToken(token);
    useAuthStore.getState().setSession({ user, token, role });
    return user;
  },

  logout: async (): Promise<void> => {
    useAuthStore.getState().logout();
  },
};
