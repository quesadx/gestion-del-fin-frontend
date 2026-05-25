import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

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
  permissions: string[];
  permissionsLoaded: boolean;
  permissionsError: string | null;
  /** Incremented to trigger a re-fetch from the UI. */
  permissionsRetry: number;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setPermissions: (permissions: string[]) => void;
  setPermissionsError: (error: string | null) => void;
  triggerPermissionsRetry: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      userId: null,
      permissions: [],
      permissionsLoaded: false,
      permissionsError: null,
      permissionsRetry: 0,

      setAuth: (user, token) => {
        const payload = parseJwtPayload(token);
        const rawId = payload.sub ?? payload.id ?? payload.userId ?? payload.user_id ?? null;
        const rawCampId = payload.campId ?? payload.camp_id ?? null;
        set({
          user: {
            ...user,
            camp_id: rawCampId != null ? Number(rawCampId) : null,
          },
          token,
          userId: rawId != null ? Number(rawId) : null,
          permissionsLoaded: false,
          permissionsError: null,
          permissionsRetry: 0,
        });
      },

      logout: () =>
        set({
          user: null,
          token: null,
          userId: null,
          permissions: [],
          permissionsLoaded: false,
          permissionsError: null,
          permissionsRetry: 0,
        }),

      setPermissions: (permissions) =>
        set({ permissions, permissionsLoaded: true, permissionsError: null }),

      setPermissionsError: (error) => set({ permissionsError: error }),

      triggerPermissionsRetry: () => set((s) => ({ permissionsRetry: s.permissionsRetry + 1 })),
    }),
    { name: 'auth-storage' },
  ),
);
