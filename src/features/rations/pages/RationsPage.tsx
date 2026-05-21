import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { usePeople } from '@/features/people/hooks/usePeople';
import {
  useInventory,
  useInventoryAudit,
  useCreateInventoryAdjustment,
} from '@/features/inventory/hooks/useInventory';
import { Utensils, Plus, ClipboardList } from 'lucide-react';
import { getServerNow } from '@/features/system/hooks/useServerTime';
import { toast } from '@/shared/lib/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const rationSchema = z.object({
  person_id: z.coerce.number().min(1, 'Select a person'),
  resource_type_id: z.coerce.number().min(1, 'Select a resource'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be positive'),
  consumed_at: z.string().min(1, 'Date/time is required'),
  notes: z.string().optional(),
});

type RationFormValues = z.infer<typeof rationSchema>;

const RATION_DESC_PREFIX = 'RATION:';

export function RationsPage() {
  const { data: camps, isLoading: campsLoading } = useCamps();
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const campId = selectedCampId ?? 0;

  const { data: people } = usePeople(campId, { page: 1, limit: 200 });
  const { data: inventory } = useInventory(campId);
  const { data: audit } = useInventoryAudit(campId);
  const adjustMutation = useCreateInventoryAdjustment();
  const [dialogOpen, setDialogOpen] = useState(false);

  const campsResponse = camps as Record<string, unknown> | undefined;
  const campsArray = Array.isArray(campsResponse?.data)
    ? (campsResponse.data as Record<string, unknown>[])
    : ([] as Record<string, unknown>[]);
  const peopleResponse = people as Record<string, unknown> | undefined;
  const peopleArray = Array.isArray(peopleResponse?.data)
    ? (peopleResponse.data as Record<string, unknown>[])
    : ([] as Record<string, unknown>[]);
  const invArray = Array.isArray(inventory) ? inventory : ([] as Record<string, unknown>[]);

  const auditArray = useMemo(
    () => (Array.isArray(audit) ? audit : ([] as Record<string, unknown>[])),
    [audit],
  );

  const rationHistory = useMemo(
    () =>
      auditArray.filter((entry: Record<string, unknown>) => {
        const desc = (entry.description as string) || '';
        const type = (entry.log_type as string) || (entry.type as string) || '';
        if (type !== 'MANUAL_OUT') return false;
        if (desc.startsWith(RATION_DESC_PREFIX)) return true;
        if (desc.startsWith('{')) {
          try {
            const parsed: unknown = JSON.parse(desc);
            if (
              parsed &&
              typeof parsed === 'object' &&
              (parsed as Record<string, unknown>).kind === 'RATION'
            )
              return true;
          } catch {
            return false;
          }
        }
        return false;
      }),
    [auditArray],
  );

  const form = useForm<RationFormValues>({
    resolver: resolved(rationSchema),
    defaultValues: {
      person_id: 0,
      resource_type_id: 0,
      quantity: 0 as unknown as number,
      consumed_at: new Date(getServerNow()).toISOString().slice(0, 16),
      notes: '',
    },
  });

  const getPersonName = (id: number): string => {
    const found = peopleArray.find((p: Record<string, unknown>) => (p.id as number) === id) as
      | Record<string, unknown>
      | undefined;
    return (found?.full_name as string) || `PERSON-${id}`;
  };

  const getResourceName = (id: number): string => {
    const found = invArray.find(
      (inv: Record<string, unknown>) =>
        (inv.resource_type_id as number) === id || (inv.id as number) === id,
    ) as Record<string, unknown> | undefined;
    const resource =
      (found?.resource as Record<string, unknown>) ||
      (found?.resource_type as Record<string, unknown>);
    return (resource?.name as string) || `RES-${id}`;
  };

  const onSubmit = async (values: RationFormValues) => {
    const personName = getPersonName(values.person_id);
    const resourceName = getResourceName(values.resource_type_id);
    const description = JSON.stringify({
      kind: 'RATION' as const,
      person: personName,
      person_id: values.person_id,
      resource: resourceName,
      consumed_at: values.consumed_at,
      notes: values.notes || '',
    });

    try {
      await adjustMutation.mutateAsync({
        camp_id: campId,
        resource_type_id: values.resource_type_id,
        type: 'MANUAL_OUT',
        quantity: values.quantity,
        description,
      });
      toast('Ration recorded successfully', 'success');
      form.reset({
        person_id: 0,
        resource_type_id: 0,
        quantity: 0 as unknown as number,
        consumed_at: new Date(getServerNow()).toISOString().slice(0, 16),
        notes: '',
      });
      setDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to record ration';
      toast(message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Panel title="RATION MANAGEMENT" tag="RTN.01" status="ONLINE" accent="cyan">
        {campsLoading ? (
          <ScreenLoader />
        ) : (
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              CAMP //
            </label>
            <select
              value={selectedCampId ?? ''}
              onChange={(e) => setSelectedCampId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">SELECT A CAMP</option>
              {campsArray.map((c: Record<string, unknown>) => (
                <option key={c.id as number} value={c.id as number}>
                  {c.name as string}
                </option>
              ))}
            </select>
          </div>
        )}
      </Panel>

      {!selectedCampId ? (
        <Panel accent="purple">
          <div className="flex flex-col items-center gap-4 py-8">
            <Utensils className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              SELECT A CAMP TO MANAGE RATIONS
            </p>
          </div>
        </Panel>
      ) : (
        <>
          <Panel title="ISSUE RATION" tag={`RTN.${campId}`} status="READY" accent="cyan">
            <div className="mb-4">
              <GlitchButton variant="primary" onClick={() => setDialogOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW RATION ENTRY
                </span>
              </GlitchButton>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 font-mono-data text-xs text-muted-foreground">
                <ClipboardList className="h-3.5 w-3.5" />
                <span>CONSUMPTION HISTORY</span>
              </div>

              {rationHistory.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-8 border border-dashed border-[oklch(0.68_0.32_340_/_0.15)] rounded-sm">
                  <Utensils className="h-8 w-8 text-[var(--neon-cyan)]/30" />
                  <p className="font-mono-data text-xs text-muted-foreground">
                    NO RATION RECORDS FOR THIS CAMP
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-data text-xs">
                    <thead>
                      <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                        <th className="py-3 px-2">DATE</th>
                        <th className="py-3 px-2">PERSON</th>
                        <th className="py-3 px-2">RESOURCE</th>
                        <th className="py-3 px-2 text-right">QUANTITY</th>
                        <th className="py-3 px-2">NOTES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rationHistory.map((entry: Record<string, unknown>) => {
                        const desc = (entry.description as string) || '';
                        let personName = '—';
                        let rNotes = '';
                        let consumedDate: string | null = null;

                        if (desc.startsWith('{')) {
                          try {
                            const parsed: unknown = JSON.parse(desc);
                            if (parsed && typeof parsed === 'object') {
                              const obj = parsed as Record<string, unknown>;
                              personName = typeof obj.person === 'string' ? obj.person : '—';
                              rNotes = typeof obj.notes === 'string' ? obj.notes : '';
                              consumedDate =
                                typeof obj.consumed_at === 'string' ? obj.consumed_at : null;
                            }
                          } catch {
                            // fall through to regex
                          }
                        }
                        if (desc.startsWith(RATION_DESC_PREFIX) || personName === '—') {
                          const personMatch = desc.match(/person=([^ ]+)/);
                          const notesMatch = desc.match(/notes=(.+)$/);
                          const consumedMatch = desc.match(/consumed_at=([^ ]+)/);
                          if (personMatch) personName = personMatch[1];
                          if (notesMatch) rNotes = notesMatch[1];
                          if (consumedMatch) consumedDate = consumedMatch[1];
                        }

                        const delta = (entry.delta as number) || (entry.quantity as number) || 0;
                        const stableKey = entry.id
                          ? String(entry.id)
                          : `${desc.slice(0, 40)}-${entry.created_at ?? ''}-${entry.resource_type_id ?? ''}`;

                        return (
                          <tr
                            key={stableKey}
                            className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                          >
                            <td className="py-2 px-2 text-muted-foreground">
                              {consumedDate
                                ? format(new Date(consumedDate), 'dd/MM/yyyy HH:mm')
                                : entry.logged_at
                                  ? format(new Date(entry.logged_at as string), 'dd/MM/yyyy HH:mm')
                                  : '—'}
                            </td>
                            <td className="py-2 px-2 text-[var(--neon-fuchsia)]">{personName}</td>
                            <td className="py-2 px-2 text-muted-foreground">
                              {getResourceName((entry.resource_type_id as number) || 0)}
                            </td>
                            <td className="py-2 px-2 text-right text-[var(--neon-yellow)] font-bold tabular-nums">
                              {Math.abs(delta)}
                            </td>
                            <td className="py-2 px-2 text-muted-foreground max-w-[200px] truncate">
                              {rNotes || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-cyan">
              NEW RATION ENTRY
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                PERSON //
              </label>
              <select
                {...form.register('person_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value={0}>SELECT...</option>
                {peopleArray.map((p: Record<string, unknown>) => (
                  <option key={p.id as number} value={p.id as number}>
                    {p.full_name as string}
                  </option>
                ))}
              </select>
              {form.formState.errors.person_id && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {form.formState.errors.person_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                RESOURCE //
              </label>
              <select
                {...form.register('resource_type_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value={0}>SELECT...</option>
                {invArray.map((inv: Record<string, unknown>) => {
                  const resource =
                    (inv.resource as Record<string, unknown>) ||
                    (inv.resource_type as Record<string, unknown>);
                  const stock = (inv.current_stock as number) || (inv.quantity as number) || 0;
                  return (
                    <option
                      key={(inv.resource_type_id as number) || (inv.id as number)}
                      value={(inv.resource_type_id as number) || (inv.id as number)}
                    >
                      {resource?.name as string}: STOCK: {stock}
                    </option>
                  );
                })}
              </select>
              {form.formState.errors.resource_type_id && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {form.formState.errors.resource_type_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                QUANTITY //
              </label>
              <input
                type="number"
                step="0.01"
                min={0.01}
                {...form.register('quantity')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {form.formState.errors.quantity && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {form.formState.errors.quantity.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                DATE / TIME //
              </label>
              <input
                type="datetime-local"
                {...form.register('consumed_at')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {form.formState.errors.consumed_at && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {form.formState.errors.consumed_at.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOTES //
              </label>
              <textarea
                {...form.register('notes')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  form.reset();
                  setDialogOpen(false);
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={adjustMutation.isPending}>
                {adjustMutation.isPending ? 'SAVING...' : 'SAVE RATION'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
