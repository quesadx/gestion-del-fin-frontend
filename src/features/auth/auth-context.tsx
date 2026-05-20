import { useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { authService, type LoginPayload } from './auth.service';
import { useAuthStore } from './store/auth.store';
import { AuthContext } from './auth-context-store';

const SESSION_TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 1_200_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isLocked = useAuthStore((state) => state.isLocked);
  const lock = useAuthStore((state) => state.lock);
  const updateActivity = useAuthStore((state) => state.updateActivity);

  const login = useCallback((credentials: LoginPayload) => authService.login(credentials), []);
  const logout = useCallback(() => authService.logout(), []);

  useEffect(() => {
    if (!token || isLocked) return;

    const handleActivity = () => updateActivity();
    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => document.addEventListener(ev, handleActivity));
    updateActivity();

    const interval = setInterval(() => {
      const elapsed = Date.now() - useAuthStore.getState().lastActivity;
      if (elapsed >= SESSION_TIMEOUT_MS) {
        lock();
        logout();
      }
    }, 10_000);

    return () => {
      clearInterval(interval);
      events.forEach((ev) => document.removeEventListener(ev, handleActivity));
    };
  }, [token, isLocked, lock, logout, updateActivity]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(token),
      isInitializing: !hasHydrated,
      login,
      logout,
    }),
    [user, token, hasHydrated, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
