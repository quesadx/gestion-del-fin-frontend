export type CampStatus = 'ACTIVE' | 'ABANDONED';

export interface Camp {
  id: number;
  name: string;
  location?: string;
  status: CampStatus;
  ai_context_prompt?: string;
  created_at: string;
  updated_at: string;
}
