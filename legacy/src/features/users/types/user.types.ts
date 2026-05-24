export interface User {
  id: number;
  username: string;
  camp_id: number;
  role_id: number;
  is_active: boolean;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}
