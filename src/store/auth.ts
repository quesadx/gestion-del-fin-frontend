import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { useDeniedPermissionsStore } from './deniedPermissions';

// Decode JWT payload client-side (no signature verification — UI display only).
// The server always enforces the token on every protected route.
const parseJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  /** Numeric user ID extracted from the JWT `sub`/`id`/`userId` claim.
   *  Required by the API for `created_by` / `changed_by` / `requested_by`. */
  userId: number | null;
  /** Whether the user has admin.bypass_camp_scoping (from JWT `isAdmin`). */
  isAdmin: boolean;
  setAuth: (user: User, token: string) => void;
  syncRolePermissions: (role: string, permissions: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      userId: null,
      isAdmin: false,

      setAuth: (user, token) => {
        useDeniedPermissionsStore.getState().reset();
        const payload = parseJwtPayload(token);
        const rawId = payload.sub ?? payload.id ?? payload.userId ?? payload.user_id ?? null;
        const rawCampId = payload.campId ?? payload.camp_id ?? null;
        const isAdmin = Boolean(payload.isAdmin ?? false);
        set({
          user: {
            ...user,
            camp_id: rawCampId != null ? Number(rawCampId) : null,
            permissions:
              user.permissions ?? (Array.isArray(payload.permissions) ? payload.permissions : []),
          },
          token,
          userId: rawId != null ? Number(rawId) : null,
          isAdmin,
        });
      },

      syncRolePermissions: (role, permissions) => {
        const nextPermissions = Array.from(new Set(permissions)).sort();
        set((state) => {
          if (!state.user) return {};

          const currentPermissions = [...(state.user.permissions ?? [])].sort();
          const permissionsChanged =
            currentPermissions.length !== nextPermissions.length ||
            currentPermissions.some((permission, index) => permission !== nextPermissions[index]);
          const roleChanged = state.user.role !== role;

          if (!permissionsChanged && !roleChanged) return {};

          useDeniedPermissionsStore.getState().reset();

          return {
            user: {
              ...state.user,
              role,
              permissions: nextPermissions,
            },
            isAdmin: nextPermissions.includes('admin.bypass_camp_scoping'),
          };
        });
      },

      // Zustand persist handles clearing the persisted entry automatically.
      logout: () => {
        useDeniedPermissionsStore.getState().reset();
        set({ user: null, token: null, userId: null, isAdmin: false });
      },
    }),
    { name: 'auth-storage' },
  ),
);
