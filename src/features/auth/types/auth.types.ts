/**
 * Authentication types
 * User roles, session data, and related structures
 */

export type Role = 'system_admin' | 'resource_manager' | 'worker' | 'travel_lead';

export interface User {
  id?: string;
  username: string;
  role?: Role;
  campId?: string;
}
