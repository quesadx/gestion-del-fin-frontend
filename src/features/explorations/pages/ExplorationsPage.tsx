import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import {
  useExplorations,
  useCreateExploration,
  useUpdateExplorationStatus,
  useDeleteExploration,
} from '@/features/explorations/hooks/useExplorations';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useResources } from '@/features/resources/hooks/useResources';
import { Compass, Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const createExplorationSchema = z.object({
  destination: z.string().min(1, 'Destination is required'),
  camp_id: z.number().min(1, 'Select a camp'),
  departure_date: z.string().min(1, 'Departure date is required'),
  expected_return_date: z.string().min(1, 'Expected return date is required'),
  max_return_date: z.string().min(1, 'Latest return date is required'),
  notes: z.string().optional(),
});

type CreateExplorationFormValues = z.infer<typeof createExplorationSchema>;

const returnIntakeSchema = z.object({
  actual_return_date: z.string().min(1, 'Return date is required'),
  resources: z.array(
    z.object({
      resource_type_id: z.number().min(1, 'Select a resource'),
      amount: z.number().min(0.01, 'Amount must be positive'),
    }),
  ),
  return_member_status: z.enum(['SICK', 'HEALTHY', 'INJURED', 'AWAY', 'DEAD']).optional(),
  notes: z.string().optional(),
});

type ReturnIntakeFormValues = z.infer<typeof returnIntakeSchema>;

const STATUS_MAP: Record<string, 'cyan' | 'yellow' | 'green' | 'red'> = {
  PLANNED: 'cyan',
  ONGOING: 'yellow',
  RETURNED: 'green',
  CANCELLED: 'red',
};

export function ExplorationsPage() {
  const { data: explorations, isLoading, isError, error, refetch } = useExplorations();
  const { data: camps } = useCamps();
  const { data: resources } = useResources();
  const createMutation = useCreateExploration();
  const updateStatusMutation = useUpdateExplorationStatus();
  const deleteMutation = useDeleteExploration();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [returnTarget, setReturnTarget] = useState<Record<string, unknown> | null>(null);

  const campsArray = Array.isArray(camps) ? camps : [];
  const expArray = Array.isArray(explorations) ? explorations : [];
  const resourcesArray = Array.isArray(resources) ? resources : ([] as Record<string, unknown>[]);

  const campMap = new Map<number, string>();
  campsArray.forEach((c: Record<string, unknown>) => campMap.set(c.id as number, c.name as string));

  const formCreate = useForm<CreateExplorationFormValues>({
    resolver: resolved(createExplorationSchema),
    defaultValues: {
      destination: '',
      camp_id: 0,
      departure_date: '',
      expected_return_date: '',
      max_return_date: '',
      notes: '',
    },
  });

  const onSubmitCreate = async (values: CreateExplorationFormValues) => {
    await createMutation.mutateAsync({
      camp_id: values.camp_id,
      created_by: 0,
      destination: values.destination,
      departure_date: new Date(values.departure_date).toISOString(),
      expected_return_date: new Date(values.expected_return_date).toISOString(),
      max_return_date: new Date(values.max_return_date).toISOString(),
      notes: values.notes || undefined,
    });
    formCreate.reset();
    setCreateOpen(false);
  };

  const formReturn = useForm<ReturnIntakeFormValues>({
    resolver: resolved(returnIntakeSchema),
    defaultValues: {
      actual_return_date: '',
      resources: [{ resource_type_id: 0, amount: 0 }],
      return_member_status: undefined,
      notes: '',
    },
  });

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: formReturn.control,
    name: 'resources',
  });

  const handleStatusSelect = (exp: Record<string, unknown>, newStatus: string) => {
    if (newStatus === 'RETURNED') {
      const today = new Date().toISOString().slice(0, 16);
      formReturn.reset({
        actual_return_date: today,
        resources: [{ resource_type_id: 0, amount: 0 }],
        return_member_status: undefined,
        notes: '',
      });
      setReturnTarget(exp);
      return;
    }

    handleStatusChange(exp.id as number, newStatus);
  };

  const handleStatusChange = async (id: number, status: string) => {
    await updateStatusMutation.mutateAsync({
      id,
      payload: {
        status: status as 'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED',
        changed_by: 0,
      },
    });
  };

  const handleReturnSubmit = async (values: ReturnIntakeFormValues) => {
    if (!returnTarget) return;

    const payload = {
      status: 'RETURNED' as const,
      actual_return_date: new Date(values.actual_return_date).toISOString(),
      changed_by: 0,
      resources_to_return: values.resources
        .filter((r) => r.resource_type_id > 0 && r.amount > 0)
        .map((r) => ({
          resource_type_id: r.resource_type_id,
          amount: r.amount,
        })),
      return_member_status: values.return_member_status,
      notes: values.notes || undefined,
    };

    await updateStatusMutation.mutateAsync({
      id: returnTarget.id as number,
      payload,
    });
    setReturnTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({
      id: deleteTarget,
      payload: { changed_by: 0 },
    });
    setDeleteTarget(null);
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="EXP.01" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load explorations'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Panel
        title="EXPLORATION LOG"
        tag="EXP.01"
        status={isLoading ? 'LOADING' : expArray.length.toString()}
        accent="cyan"
      >
        {expArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Compass className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              NO EXPLORATIONS REGISTERED
            </p>
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                NEW EXPLORATION
              </span>
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW EXPLORATION
                </span>
              </GlitchButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2">DESTINATION</th>
                    <th className="py-3 px-2">STATUS</th>
                    <th className="py-3 px-2">DEPARTURE</th>
                    <th className="py-3 px-2">EXPECTED RETURN</th>
                    <th className="py-3 px-2">CAMP</th>
                    <th className="py-3 px-2">CHANGE STATUS</th>
                    <th className="py-3 px-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {expArray.map((exp: Record<string, unknown>) => (
                    <tr
                      key={exp.id as number}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">
                        {exp.destination as string}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge
                          status={exp.status as string}
                          variant={STATUS_MAP[exp.status as string] || 'cyan'}
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {exp.departure_date
                          ? format(new Date(exp.departure_date as string), 'dd/MM/yyyy')
                          : '—'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {exp.expected_return_date
                          ? format(new Date(exp.expected_return_date as string), 'dd/MM/yyyy')
                          : '—'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {campMap.get(exp.camp_id as number) || (exp.camp_id as string)}
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={exp.status as string}
                          onChange={(e) => handleStatusSelect(exp, e.target.value)}
                          className="rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-2 py-1 text-[10px] text-foreground outline-none font-mono-data"
                        >
                          <option value="PLANNED">PLANNED</option>
                          <option value="ONGOING">ONGOING</option>
                          <option value="RETURNED">RETURNED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp.id as number)}
                          className="p-1.5 rounded-sm text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              NEW EXPLORATION
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formCreate.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                DESTINATION //
              </label>
              <input
                {...formCreate.register('destination')}
                type="text"
                placeholder="AREA 7G"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {formCreate.formState.errors.destination && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formCreate.formState.errors.destination.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                CAMP //
              </label>
              <select
                {...formCreate.register('camp_id', { valueAsNumber: true })}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value="0">SELECT...</option>
                {campsArray.map((c: Record<string, unknown>) => (
                  <option key={c.id as number} value={c.id as number}>
                    {c.name as string}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  DEPARTURE //
                </label>
                <input
                  {...formCreate.register('departure_date')}
                  type="datetime-local"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-2 py-2 text-xs text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  EXPECTED RETURN //
                </label>
                <input
                  {...formCreate.register('expected_return_date')}
                  type="datetime-local"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-2 py-2 text-xs text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  LATEST RETURN //
                </label>
                <input
                  {...formCreate.register('max_return_date')}
                  type="datetime-local"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-2 py-2 text-xs text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOTES //
              </label>
              <textarea
                {...formCreate.register('notes')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  formCreate.reset();
                  setCreateOpen(false);
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREATING...' : 'CREATE'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Return Intake Dialog */}
      <Dialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-cyan">
              RETURN INTAKE — {returnTarget?.destination as string}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formReturn.handleSubmit(handleReturnSubmit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ACTUAL RETURN DATE //
              </label>
              <input
                type="datetime-local"
                {...formReturn.register('actual_return_date')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {formReturn.formState.errors.actual_return_date && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formReturn.formState.errors.actual_return_date.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                RESOURCES RECOVERED //
              </label>
              <div className="space-y-2">
                {resourceFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="flex gap-2 items-end p-2 border border-[oklch(0.68_0.32_340_/_0.2)] rounded-sm"
                  >
                    <div className="flex-1">
                      <label className="text-[9px] text-muted-foreground">RESOURCE</label>
                      <select
                        {...formReturn.register(`resources.${index}.resource_type_id`, {
                          valueAsNumber: true,
                        })}
                        className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                      >
                        <option value={0}>SELECT...</option>
                        {resourcesArray.map((r: Record<string, unknown>) => (
                          <option key={r.id as number} value={r.id as number}>
                            {r.name as string} ({r.unit as string})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="text-[9px] text-muted-foreground">AMOUNT</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        {...formReturn.register(`resources.${index}.amount`, {
                          valueAsNumber: true,
                        })}
                        className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                      />
                    </div>
                    {resourceFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResource(index)}
                        className="p-1 rounded-sm text-red-400 hover:bg-red-400/10 mb-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => appendResource({ resource_type_id: 0, amount: 0 })}
                className="mt-2 text-[10px] text-[var(--neon-cyan)] hover:text-[var(--neon-fuchsia)] font-mono-data"
              >
                + ADD RESOURCE
              </button>
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                MEMBER STATUS //
              </label>
              <select
                {...formReturn.register('return_member_status')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value="">NO CHANGE</option>
                <option value="HEALTHY">HEALTHY</option>
                <option value="SICK">SICK</option>
                <option value="INJURED">INJURED</option>
                <option value="AWAY">AWAY</option>
                <option value="DEAD">DEAD</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOTES //
              </label>
              <textarea
                {...formReturn.register('notes')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => setReturnTarget(null)}>
                CANCEL
              </GlitchButton>
              <GlitchButton
                variant="primary"
                type="submit"
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'PROCESSING...' : 'CONFIRM RETURN'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              CONFIRM DELETE
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] font-mono-data text-xs">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs"
            >
              {deleteMutation.isPending ? 'DELETING...' : 'DELETE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
