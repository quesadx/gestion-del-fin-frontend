export const RATION_DESC_PREFIX = 'RATION:' as const;

export interface CreateRationDto {
  person_id: number;
  resource_type_id: number;
  quantity: number;
  consumed_at: string;
  notes?: string;
}

export interface RationEntry {
  id: number;
  person_id: number;
  person_name: string;
  resource_type_id: number;
  resource_name: string;
  quantity: number;
  consumed_at: string;
  notes: string;
}

export interface RationFormValues {
  person_id: number;
  resource_type_id: number;
  quantity: number;
  consumed_at: string;
  notes?: string;
}
