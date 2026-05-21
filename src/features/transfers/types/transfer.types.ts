export type TransferStatus =
  | 'PENDING'
  | 'APPROVED_SOURCE'
  | 'APPROVED_TARGET'
  | 'COMPLETED'
  | 'REJECTED';
export type TransferType = 'RESOURCE' | 'PERSON' | 'MIXED';
export type TransferItemType = 'RESOURCE' | 'PERSON';

export interface TransferItemEntity {
  id: number;
  item_type: TransferItemType;
  resource_type_id?: number;
  person_id?: number;
  quantity?: number;
  resource_type?: { id: number; name: string; unit: string };
  person?: { id: number; full_name: string };
}

export interface Transfer {
  id: number;
  requesting_camp: number;
  target_camp: number;
  type: TransferType;
  status: TransferStatus;
  requested_by: number;
  notes?: string;
  leader_person_id?: number;
  scheduled_delivery_date?: string;
  approved_source_at?: string;
  approved_target_at?: string;
  created_at: string;
  updated_at: string;
  requesting_camp_info?: { id: number; name: string };
  target_camp_info?: { id: number; name: string };
  items?: TransferItemEntity[];
}
