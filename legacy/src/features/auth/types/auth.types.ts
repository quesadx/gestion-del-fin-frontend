export type Role = 'system_admin' | 'resource_manager' | 'worker' | 'travel_coordinator';

export const ALL_ROLES: readonly Role[] = [
  'system_admin',
  'resource_manager',
  'worker',
  'travel_coordinator',
] as const;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: {
    username: string;
    role: string;
  };
  token: string;
}

export interface AuthUser {
  username: string;
}
