export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  RESOURCE_MANAGER = 'resource_manager',
  TRAVEL_COORDINATOR = 'travel_coordinator',
  SURVIVOR = 'survivor',
}

export interface User {
  id: number;
  username: string;
  role: string; // API returns strings like "ADMIN" — keep as string
  camp_id: number | null;
  is_active?: boolean;
}

export interface Camp {
  id: number;
  name: string;
  location: string | null;
  status: 'ACTIVE' | 'ABANDONED';
  ai_context_prompt: string | null;
  created_at?: string;
}

export interface Resource {
  id: number;
  name: string;
  unit: string;
  daily_ration: number;
  minimum_stock: number;
  auto_daily: boolean;
}

export interface InventoryItem {
  id: number;
  camp_id: number;
  resource_type_id: number;
  quantity: number;
  last_updated?: string;
}

export interface InventorySnapshot {
  resource_id: number;
  resource_name: string;
  unit: string;
  quantity: number;
  minimum_stock: number;
  daily_ration: number;
  daily_usage: number;
  projection_days: number | null;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL';
}

export interface Person {
  id: number;
  full_name: string;
  age: number | null;
  profession_id: number | null;
  profession_name: string | null; // joined by some backends
  skills_summary?: string | null;
  status: 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD' | 'WOUNDED' | 'MISSING' | 'DECEASED';
  camp_id: number;
  photo_url?: string | null;
  identification_code?: string | null;
  blood_type?: string | null;
  admitted_at?: string | null;
}

export interface Admission {
  id: number;
  camp_id: number;
  // The contract field is applicant_name; some responses may also include full_name
  applicant_name?: string;
  full_name?: string;
  applicant_age?: number | null;
  applicant_skills?: string | null;
  health_notes?: string | null;
  background_notes?: string | null;
  photo_url?: string | null;
  id_card_url?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  final_decision?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  ai_decision?: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  ai_analysis?: string | null;
  ai_reasoning?: string | null;
  ai_confidence?: number | null;
  ai_suggested_profession?: string | null;
  ai_profession_id?: number | null;
  corrected_profession_id?: number | null;
  created_at: string;
  details?: {
    age: number;
    medical_data: string;
    skills: string;
    reasoning: string;
  };
}

export interface Profession {
  id: number;
  name: string;
  description?: string;
}

export interface ResourceAllocation {
  resource_type_id: number;
  amount: number;
}

export interface ExplorationMember {
  person_id: number;
}

export interface Expedition {
  id: number;
  camp_id: number;
  // The contract calls the model "Exploration"; destination is the primary label
  destination: string;
  title?: string; // kept for backward compat (may not exist on real API)
  // Real API status enum: PLANNED | ONGOING | RETURNED | CANCELLED
  status: 'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED' | 'PLANNING' | 'ACTIVE' | 'LOST';
  departure_date: string;
  expected_return_date?: string;
  max_return_date?: string;
  actual_return_date?: string;
  notes?: string | null;
  created_at?: string;
  members?: ExplorationMember[];
  allocated_resources?: ResourceAllocation[];
  found_resources?: ResourceAllocation[];
}
