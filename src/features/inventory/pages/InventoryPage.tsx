import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { TacticalButton } from '@/components/tactical/TacticalButton';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { StockBarChart } from '@/components/tactical/StockBarChart';
import type { StockBarEntry } from '@/components/tactical/StockBarChart';
import { useCamps } from '@/features/camps/hooks/useCamps';
import {
  useInventory,
  useCreateInventoryAdjustment,
} from '@/features/inventory/hooks/useInventory';
import { useStockAlerts } from '@/features/inventory/hooks/useStockAlerts';
import { StockAlertBanner } from '@/features/inventory/components/StockAlertBanner';
import { toast } from '@/shared/lib/toast';
import { Warehouse, ClipboardList, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const adjustmentSchema = z.object({
  resource_type_id: z.coerce.number().min(1, 'Select a resource'),
  type: z.enum(['MANUAL_IN', 'MANUAL_OUT']),
  quantity: z.coerce.number().min(1, 'Quantity must be greater than 0'),
  description: z.string().optional(),
});

type AdjustmentFormValues = z.infer<typeof adjustmentSchema>;

export function InventoryPage() {
  const navigate = useNavigate();
  const { data: camps, isLoading: campsLoading } = useCamps();
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const {
    data: inventory,
    isLoading: invLoading,
    isError: invError,
    error: invErr,
    refetch,
  } = useInventory(selectedCampId ?? 0);
  const createAdjustment = useCreateInventoryAdjustment();
  const [adjustOpen, setAdjustOpen] = useState(false);
  const stockAlerts = useStockAlerts(selectedCampId ?? 0);

  const campsArray = camps?.data ?? [];
  const invArray = useMemo(() => (Array.isArray(inventory) ? inventory : []), [inventory]);

  const stockChartData: StockBarEntry[] = useMemo(
    () =>
      invArray.map((item) => {
        const current = item.quantity || 0;
        const minimum = item.min_stock || 0;
        const resource = item.resource;
        const status: 'CRITICAL' | 'LOW' | 'OK' =
          current === 0 ? 'CRITICAL' : current < minimum ? 'LOW' : 'OK';
        return {
          name: resource?.name || `ID:${item.resource_type_id}`,
          current,
          minimum,
          status,
        };
      }),
    [invArray],
  );

  const adjForm = useForm<AdjustmentFormValues>({
    resolver: resolved(adjustmentSchema),
    defaultValues: { resource_type_id: 0, type: 'MANUAL_IN', quantity: 1, description: '' },
  });

  const onSubmitAdjust = async (values: AdjustmentFormValues) => {
    if (!selectedCampId) return;
    try {
      await createAdjustment.mutateAsync({
        camp_id: selectedCampId,
        ...values,
      });
      toast('Inventory adjustment applied successfully', 'success');
      setAdjustOpen(false);
      adjForm.reset();
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to apply adjustment';
      toast(message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <GlassPanel
        title="INVENTORY"
        tag="INV.01"
        status={selectedCampId ? 'ONLINE' : 'AWAITING'}
        accent="cyan"
      >
        {campsLoading ? (
          <HoloLoader />
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Warehouse className="h-8 w-8 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO CAMPS AVAILABLE</p>
          </div>
        ) : (
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              CAMP //
            </label>
            <select
              value={selectedCampId ?? ''}
              onChange={(e) => setSelectedCampId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">SELECT A CAMP</option>
              {campsArray.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </GlassPanel>

      {!selectedCampId ? (
        <GlassPanel accent="amber">
          <div className="flex flex-col items-center gap-4 py-8">
            <Warehouse className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">SELECT A CAMP</p>
          </div>
        </GlassPanel>
      ) : invLoading ? (
        <HoloLoader />
      ) : invError ? (
        <GlassPanel title="ERROR" status="ERROR" accent="amber">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(invErr as Error)?.message || 'Failed to load inventory'}
          </p>
          <TacticalButton variant="warning" onClick={() => refetch()}>
            RETRY
          </TacticalButton>
        </GlassPanel>
      ) : invArray.length === 0 ? (
        <GlassPanel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardList className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">INVENTORY IS EMPTY</p>
          </div>
        </GlassPanel>
      ) : (
        <GlassPanel
          title="CURRENT STOCK"
          tag={`INV.${selectedCampId}`}
          status={
            stockAlerts.hasAlerts
              ? `${invArray.length} ITEMS / ${stockAlerts.totalCritical} CRITICAL`
              : `${invArray.length} ITEMS`
          }
          accent="cyan"
        >
          <StockAlertBanner alerts={stockAlerts} />

          {stockChartData.length > 0 && (
            <div className="mt-4 mb-4">
              <div className="flex items-center gap-2 mb-2 font-mono-data text-[10px] text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-[var(--neon-cyan)] animate-pulse" />
                STOCK DISTRIBUTION
              </div>
              <div className="glass-heavy rounded-md p-4 border border-[oklch(0.68_0.32_340_/_0.2)]">
                <StockBarChart
                  data={stockChartData}
                  height={Math.max(160, stockChartData.length * 36)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 mb-4 mt-4">
            <TacticalButton variant="primary" onClick={() => setAdjustOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                MANUAL ADJUSTMENT
              </span>
            </TacticalButton>
            <TacticalButton variant="ghost" onClick={() => navigate('/inventory/audit')}>
              <span className="flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5" />
                AUDIT
              </span>
            </TacticalButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-3 px-2 font-semibold">RESOURCE</th>
                  <th className="py-3 px-2 font-semibold">CURRENT STOCK</th>
                  <th className="py-3 px-2 font-semibold">MINIMUM</th>
                  <th className="py-3 px-2 font-semibold">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {invArray.map((item) => {
                  const current = item.quantity || 0;
                  const min = item.min_stock || 0;
                  const aboveMin = current >= min;
                  const resourceName = item.resource?.name || String(item.resource_type_id);
                  return (
                    <tr
                      key={item.id as number}
                      className={`border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors ${!aboveMin ? 'bg-red-400/5' : ''}`}
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">
                        {resourceName as string}
                      </td>
                      <td className="py-3 px-2 text-foreground font-bold">{current}</td>
                      <td className="py-3 px-2 text-muted-foreground">{min}</td>
                      <td className="py-3 px-2">
                        <StatusBadge
                          status={aboveMin ? 'OK' : 'CRITICAL'}
                          variant={aboveMin ? 'green' : 'red'}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}

      <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              MANUAL INVENTORY ADJUSTMENT
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={adjForm.handleSubmit(onSubmitAdjust)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                RESOURCE //
              </label>
              <select
                {...adjForm.register('resource_type_id')}
                className="w-full rounded-md bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="">SELECT...</option>
                {invArray.map((item) => (
                  <option
                    key={item.resource_type_id || item.id}
                    value={item.resource_type_id || item.resource?.id}
                  >
                    {item.resource?.name || String(item.resource_type_id)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  TYPE //
                </label>
                <select
                  {...adjForm.register('type')}
                  className="w-full rounded-md bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                >
                  <option value="MANUAL_IN">IN</option>
                  <option value="MANUAL_OUT">OUT</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  QUANTITY //
                </label>
                <input
                  {...adjForm.register('quantity')}
                  type="number"
                  min={1}
                  className="w-full rounded-md bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                DESCRIPTION //
              </label>
              <textarea
                {...adjForm.register('description')}
                rows={3}
                className="w-full rounded-md bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <TacticalButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setAdjustOpen(false);
                  adjForm.reset();
                }}
              >
                CANCEL
              </TacticalButton>
              <TacticalButton variant="primary" type="submit" disabled={createAdjustment.isPending}>
                {createAdjustment.isPending ? 'PROCESSING...' : 'APPLY ADJUSTMENT'}
              </TacticalButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
