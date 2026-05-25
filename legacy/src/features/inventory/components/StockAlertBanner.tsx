import { GlassPanel } from '@/components/tactical/GlassPanel';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { AlertTriangle } from 'lucide-react';
import type { StockAlerts } from '@/features/inventory/hooks/useStockAlerts';

export function StockAlertBanner({ alerts }: { alerts: StockAlerts }) {
  if (!alerts.hasAlerts) return null;

  return (
    <GlassPanel
      title="STOCK ALERTS"
      tag={`ALR.${alerts.campId}`}
      status={`${alerts.totalCritical} CRITICAL`}
      accent="amber"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 font-mono-data text-xs text-[var(--neon-yellow)]">
          <AlertTriangle className="h-4 w-4" />
          <span>
            {alerts.totalCritical} resource{alerts.totalCritical > 1 ? 's' : ''} below minimum
            threshold
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono-data text-xs">
            <thead>
              <tr className="border-b border-[oklch(0.68_0.32_340_/_0.15)] text-muted-foreground">
                <th className="py-2 px-2 font-semibold">RESOURCE</th>
                <th className="py-2 px-2 font-semibold text-right">CURRENT</th>
                <th className="py-2 px-2 font-semibold text-right">MINIMUM</th>
                <th className="py-2 px-2 font-semibold text-right">DEFICIT</th>
                <th className="py-2 px-2 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {alerts.criticalItems.map((item) => (
                <tr
                  key={item.resource_type_id}
                  className="border-b border-[oklch(0.68_0.32_340_/_0.08)]"
                >
                  <td className="py-2 px-2 text-[var(--neon-fuchsia)]">{item.resourceName}</td>
                  <td className="py-2 px-2 text-right text-[var(--neon-yellow)] font-bold tabular-nums">
                    {item.currentStock}
                  </td>
                  <td className="py-2 px-2 text-right text-muted-foreground tabular-nums">
                    {item.minimumStock}
                  </td>
                  <td className="py-2 px-2 text-right text-red-400 font-bold tabular-nums">
                    -{item.deficit}
                    {item.unit ? ` ${item.unit}` : ''}
                  </td>
                  <td className="py-2 px-2">
                    <StatusBadge status="REFILL NEEDED" variant="red" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </GlassPanel>
  );
}
