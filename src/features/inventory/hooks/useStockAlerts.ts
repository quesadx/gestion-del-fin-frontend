import { useMemo } from 'react';
import { useInventory } from '@/features/inventory/hooks/useInventory';

export interface StockAlertItem {
  resource_type_id: number;
  resourceName: string;
  currentStock: number;
  minimumStock: number;
  deficit: number;
  unit: string;
}

export interface StockAlerts {
  criticalItems: StockAlertItem[];
  totalCritical: number;
  hasAlerts: boolean;
  campId: number;
}

export function useStockAlerts(campId: number): StockAlerts {
  const { data: inventory } = useInventory(campId);

  return useMemo(() => {
    const items = Array.isArray(inventory) ? inventory : [];

    const criticalItems: StockAlertItem[] = items
      .map((item: Record<string, unknown>) => {
        const current = (item.current_stock as number) || 0;
        const min = (item.minimum_stock as number) || 0;
        if (current >= min) return null;

        const resource = item.resource as Record<string, unknown> | undefined;
        return {
          resource_type_id: (item.resource_type_id as number) || 0,
          resourceName: (resource?.name as string) || `RESOURCE_${item.resource_type_id}`,
          currentStock: current,
          minimumStock: min,
          deficit: min - current,
          unit: (resource?.unit as string) || '',
        };
      })
      .filter((item): item is StockAlertItem => item !== null);

    return {
      criticalItems,
      totalCritical: criticalItems.length,
      hasAlerts: criticalItems.length > 0,
      campId,
    };
  }, [inventory, campId]);
}
