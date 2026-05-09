import { createContext } from 'react';
import type { AuthUser, Role } from './types/auth.types';
import type { LoginRequest } from '@/shared/api/types';

export interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
