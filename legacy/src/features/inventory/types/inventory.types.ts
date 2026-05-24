export interface InventoryItem {
  id: number;
  camp_id: number;
  resource_type_id: number;
  quantity: number;
  min_stock?: number;
  max_stock?: number;
  resource?: { id: number; name: string; unit: string };
  resource_type?: { id: number; name: string; unit: string };
}

export interface InventoryAuditEntry {
  id: number;
  camp_id: number;
  resource_type_id: number;
  type?: string;
  log_type?: string;
  quantity: number;
  description?: string;
  previous_quantity?: number;
  new_quantity?: number;
  created_at: string;
  changed_by?: number;
}
