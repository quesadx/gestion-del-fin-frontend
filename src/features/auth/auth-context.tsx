import { useCallback, useMemo, type ReactNode } from 'react';
import { authService, type LoginPayload } from './auth.service';
import { useAuthStore } from './store/auth.store';
import { AuthContext } from './auth-context-store';

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);

  const login = useCallback((credentials: LoginPayload) => authService.login(credentials), []);
  const logout = useCallback(() => authService.logout(), []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
