import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { authService, type LoginPayload } from './auth.service';
import { useAuthStore } from './store/auth.store';
import type { AuthUser } from './types/auth.types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
