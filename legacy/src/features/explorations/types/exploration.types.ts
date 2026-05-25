import type {
  ExpeditionStatus,
  ExplorationMember,
  ResourceAllocation,
} from '../api/explorations.api';

export interface Exploration {
  id: number;
  camp_id: number;
  created_by: number;
  destination: string;
  departure_date: string;
  expected_return_date: string;
  max_return_date: string;
  actual_return_date?: string;
  status: ExpeditionStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
  members?: ExplorationMember[];
  allocated_resources?: ResourceAllocation[];
  found_resources?: ResourceAllocation[];
  camps?: { name: string };
  users?: { username: string };
}
