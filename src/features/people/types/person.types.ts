import type { PersonStatus } from '@/shared/api/types';

export interface Person {
  id: number;
  full_name: string;
  camp_id: number;
  profession_id?: number;
  status: PersonStatus;
  age?: number;
  blood_type?: string;
  identification_code?: string;
  skills_summary?: string;
  photo_url?: string;
  admitted_at: string;
  created_at: string;
  updated_at: string;
  professions?: { id: number; name: string };
  person_status_log?: Array<{
    id: number;
    new_status: string;
    changed_at: string;
    reason?: string;
  }>;
}
