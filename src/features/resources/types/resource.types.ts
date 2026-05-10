export interface Resource {
  id: number;
  name: string;
  unit: string;
  daily_ration: number;
  minimum_stock: number;
  auto_daily: boolean;
  created_at: string;
  updated_at: string;
}
