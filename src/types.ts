export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  RESOURCE_MANAGER = 'resource_manager',
  TRAVEL_COORDINATOR = 'travel_coordinator',
  WORKER = 'worker',
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
  daily_ration: string | number;
  minimum_stock: string | number;
  auto_daily: boolean;
}

export interface InventoryItem {
  resource_type_id: number;
  resource_name: string;
  unit: string;
  quantity: number;
  minimum_stock: number;
  is_below_minimum: boolean;
  created_at?: string;
  deleted_at?: string | null;
  resource_type?: {
    id: number;
    name: string;
    unit: string;
    minimum_stock: number;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
  };
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
  status: 'OK' | 'LOW' | 'CRITICAL' | 'OVERSTOCKED';
}

export interface InventoryAuditEntry {
  id?: number | string;
  created_at?: string;
  timestamp?: string;
  type?: 'MANUAL_IN' | 'MANUAL_OUT' | string;
  log_type?: 'MANUAL_IN' | 'MANUAL_OUT' | string;
  quantity?: number;
  description?: string;
  notes?: string;
  user?: { username?: string };
  username?: string;
  user_id?: number | string;
  resource_name?: string;
  resource_type_id?: number;
  resource?: { name?: string };
  unit?: string;
  inventory_quantity?: number;
  log_delta_sum?: number;
  discrepancy?: string | number;
  is_consistent?: boolean;
}

export interface ResourceLookup {
  id: number;
  name: string;
  unit: string;
  minimum_stock?: number;
  daily_ration?: number;
}

export interface Person {
  id: number;
  full_name: string;
  age: number | null;
  profession_id: number | null;
  profession_name: string | null; // joined by some backends
  skills_summary?: string | null;
  status: 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD';
  camp_id: number;
  photo_url?: string | null;
  identification_code?: string | null;
  blood_type?: string | null;
  admitted_at?: string | null;
}

export interface Admission {
  id: number;
  camp_id: number;
  applicant_name?: string;
  full_name?: string;
  applicant_age?: number | null;
  applicant_skills?: string | null;
  health_notes?: string | null;
  background_notes?: string | null;
  photo_url?: string | null;
  id_card_url?: string | null;
  final_decision?: 'ACCEPTED' | 'REJECTED' | 'PENDING';
  ai_decision?: 'ACCEPTED' | 'PENDING' | 'REJECTED';
  ai_reasoning?: string | null;
  ai_confidence?: number | null;
  ai_suggested_profession?: string | null;
  ai_profession_id?: number | null;
  corrected_profession_id?: number | null;
  correction_reason?: string | null;
  person_id?: number | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Profession {
  id: number;
  name: string;
  description?: string;
}

export interface Permission {
  id: number;
  name: string;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  is_system?: boolean;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
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
  status: 'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED';
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
