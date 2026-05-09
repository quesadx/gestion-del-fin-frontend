import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, Role } from '@/features/auth/types/auth.types';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: Role | null;
  isLocked: boolean;
  lastActivity: number;
  setSession: (payload: { user: AuthUser; token: string; role?: Role | null }) => void;
  logout: () => void;
  updateActivity: () => void;
  lock: () => void;
  unlock: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isLocked: false,
      lastActivity: Date.now(),
      setSession: ({ user, token, role }) =>
        set({
          user,
          token,
          role: role ?? user.role,
          isLocked: false,
          lastActivity: Date.now(),
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          role: null,
          isLocked: false,
          lastActivity: Date.now(),
        }),
      updateActivity: () => set({ lastActivity: Date.now() }),
      lock: () => set({ isLocked: true }),
      unlock: () => set({ isLocked: false, lastActivity: Date.now() }),
    }),
    {
      name: 'gdf.auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
      }),
    },
  ),
);
