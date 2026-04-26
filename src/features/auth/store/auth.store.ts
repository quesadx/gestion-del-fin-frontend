import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Role, User } from '../types/auth.types';

interface AuthState {
  user: User | null;
  token: string | null;
  role: Role | null;
  lastActivity: number;
  isLocked: boolean;

  login: (token: string, user: User) => void;
  logout: () => void;
  updateActivity: () => void;
  lock: () => void;
  unlock: (password: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      lastActivity: Date.now(),
      isLocked: false,

      login: (token, user) =>
        set({
          token,
          user,
          role: user.role,
          lastActivity: Date.now(),
          isLocked: false,
        }),

      logout: () =>
        set({
          user: null,
          token: null,
          role: null,
          isLocked: false,
        }),

      updateActivity: () => set({ lastActivity: Date.now() }),

      lock: () => set({ isLocked: true }),

      unlock: async (password) => {
        const { authApi } = await import('../api/auth.api');
        const result = await authApi.verifySession(password);

        if (result.valid) {
          set({ isLocked: false, lastActivity: Date.now() });
        }

        return result.valid;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ token: s.token, user: s.user, role: s.role }),
    },
  ),
);
