import { authApi } from './api/auth.api';
import { useAuthStore } from './store/auth.store';
import type { AuthUser, Role, LoginRequest } from './types/auth.types';
import { ALL_ROLES } from './types/auth.types';

export type LoginPayload = LoginRequest;

export const authService = {
  login: async (payload: LoginPayload): Promise<AuthUser> => {
    const { user, token } = await authApi.login(payload);

    let jwtPayload: Record<string, unknown> | null = null;
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        jwtPayload = JSON.parse(atob(parts[1]));
      }
    } catch {
      throw new Error('Invalid token format: unable to decode JWT payload');
    }

    const role = jwtPayload?.role ?? null;
    const rawUserId = jwtPayload?.userId ?? null;
    const userId = typeof rawUserId === 'number' && Number.isInteger(rawUserId) ? rawUserId : null;

    if (role && typeof role === 'string' && (ALL_ROLES as readonly string[]).includes(role)) {
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
