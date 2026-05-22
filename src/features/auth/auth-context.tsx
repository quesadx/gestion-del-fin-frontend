import { useCallback, useMemo, useEffect, useRef, type ReactNode } from 'react';
import { authService, type LoginPayload } from './auth.service';
import { useAuthStore } from './store/auth.store';
import { AuthContext } from './auth-context-store';
import { getServerNow } from '@/features/system/hooks/useServerTime';

const SESSION_TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MS) || 1_200_000;
const ACTIVITY_THROTTLE_MS = 5_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isLocked = useAuthStore((state) => state.isLocked);
  const lock = useAuthStore((state) => state.lock);
  const updateActivity = useAuthStore((state) => state.updateActivity);

  const login = useCallback((credentials: LoginPayload) => authService.login(credentials), []);
  const logout = useCallback(() => authService.logout(), []);

  const lastActivityRef = useRef(0);

  useEffect(() => {
    if (!token || isLocked) return;

    const now = getServerNow();
    lastActivityRef.current = now;
    const storedLastActivity = useAuthStore.getState().lastActivity;
    if (now - storedLastActivity < ACTIVITY_THROTTLE_MS) {
      return;
    }
    updateActivity();
  }, [token, isLocked, updateActivity]);

  useEffect(() => {
    if (!token || isLocked) return;

    const handleActivity = () => {
      const now = getServerNow();
      if (now - lastActivityRef.current < ACTIVITY_THROTTLE_MS) return;
      lastActivityRef.current = now;
      updateActivity();
    };

    const events: (keyof DocumentEventMap)[] = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((ev) => document.addEventListener(ev, handleActivity));
    updateActivity();

    const interval = setInterval(() => {
      const elapsed = getServerNow() - useAuthStore.getState().lastActivity;
      if (elapsed >= SESSION_TIMEOUT_MS) {
        lock();
      }
    }, 10_000);

    return () => {
      clearInterval(interval);
      events.forEach((ev) => document.removeEventListener(ev, handleActivity));
    };
  }, [token, isLocked, lock, updateActivity]);

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
