import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
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
import { usePeople } from '@/features/people/hooks/usePeople';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from '@/shared/lib/toast';
import { useResources } from '@/features/resources/hooks/useResources';
import { Compass, Plus, Trash2, FilterX, Users, Package, Gift } from 'lucide-react';
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

const createExplorationSchema = z
  .object({
    destination: z.string().min(1, 'Destination is required'),
    camp_id: z.number().min(1, 'Select a camp'),
    departure_date: z.string().min(1, 'Departure date is required'),
    expected_return_date: z.string().min(1, 'Expected return date is required'),
    max_return_date: z.string().min(1, 'Latest return date is required'),
    notes: z.string().optional(),
  })
  .refine(
    (data) =>
      !data.departure_date ||
      !data.expected_return_date ||
      data.departure_date < data.expected_return_date,
    {
      message: 'Expected return must be after departure',
      path: ['expected_return_date'],
    },
  )
  .refine(
    (data) =>
      !data.expected_return_date ||
      !data.max_return_date ||
      data.expected_return_date <= data.max_return_date,
    {
      message: 'Latest return must be on or after expected return',
      path: ['max_return_date'],
    },
  );

type CreateExplorationFormValues = z.infer<typeof createExplorationSchema>;

const STATUS_MAP: Record<string, 'red' | 'amber' | 'green'> = {
  PLANNED: 'red',
  ONGOING: 'amber',
  RETURNED: 'green',
  CANCELLED: 'red',
};

export function ExplorationsPage() {
  const navigate = useNavigate();
  const { data: explorations, isLoading, isError, error, refetch } = useExplorations();
  const { data: camps } = useCamps();
  const { data: resources } = useResources({ enabled: true });
  const userId = useAuthStore((state) => state.userId);
  const createMutation = useCreateExploration();
  const updateStatusMutation = useUpdateExplorationStatus();
  const deleteMutation = useDeleteExploration();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; destination: string } | null>(
    null,
  );
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    id: number;
    destination: string;
    currentStatus: string;
    newStatus: string;
  } | null>(null);
  const [statusConfirmError, setStatusConfirmError] = useState<string | null>(null);
  const [campFilter, setCampFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [returnResources, setReturnResources] = useState<
    { resource_type_id: number; amount: number }[]
  >([{ resource_type_id: 0, amount: 0 }]);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().slice(0, 16));
  const [returnNotes, setReturnNotes] = useState('');
  const [returnError, setReturnError] = useState<string | null>(null);

  const campsArray = camps?.data ?? [];
  const expArray = Array.isArray(explorations) ? explorations : [];
  const resourcesArray = Array.isArray(resources) ? resources : [];

  const hasActiveFilters = Boolean(campFilter || statusFilter);

  const filteredExps = expArray.filter((exp) => {
    if (campFilter && (exp.camp_id as number) !== Number(campFilter)) return false;
    if (statusFilter && (exp.status as string) !== statusFilter) return false;
    return true;
  });

  const campIsEmpty = expArray.length === 0;
  const filterIsEmpty = !campIsEmpty && filteredExps.length === 0 && hasActiveFilters;

  const clearFilters = () => {
    setCampFilter('');
    setStatusFilter('');
  };

  const campMap = new Map<number, string>();
  campsArray.forEach((c) => campMap.set(c.id, c.name));

  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

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

  const watchedCampId = useWatch({ control: formCreate.control, name: 'camp_id' });
  const { data: people } = usePeople(watchedCampId || 0, { page: 1, limit: 100 });
  const peopleArray = people?.data ?? [];

  const availablePeople = peopleArray.filter(
    (p) => (p.status as string) !== 'AWAY' && (p.status as string) !== 'DEAD',
  );
  const unavailableCount = peopleArray.length - availablePeople.length;

  const onSubmitCreate = async (values: CreateExplorationFormValues) => {
    setCreateError(null);
    if (!userId) {
      setCreateError('User ID not available. Please re-login.');
      return;
    }
    if (selectedMembers.length === 0) {
      setCreateError('Select at least one member for the expedition');
      return;
    }
    try {
      await createMutation.mutateAsync({
        camp_id: values.camp_id,
        created_by: userId,
        destination: values.destination,
        departure_date: values.departure_date.slice(0, 10),
        expected_return_date: values.expected_return_date.slice(0, 10),
        max_return_date: values.max_return_date.slice(0, 10),
        notes: values.notes || undefined,
        members:
          selectedMembers.length > 0
            ? selectedMembers.map((pid) => ({ person_id: pid }))
            : undefined,
      });
      toast('Exploration created successfully', 'success');
      formCreate.reset();
      setSelectedMembers([]);
      setCreateOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      setCreateError(message);
    }
  };

  const handleStatusChange = (
    id: number,
    destination: string,
    currentStatus: string,
    newStatus: string,
  ) => {
    if (currentStatus === newStatus) return;
    setStatusTarget({ id, destination, currentStatus, newStatus });
    setStatusConfirmError(null);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setStatusConfirmError(null);

    const validResources =
      statusTarget.newStatus === 'RETURNED'
        ? returnResources.filter((r) => r.resource_type_id > 0 && r.amount > 0)
        : [];

    try {
      await updateStatusMutation.mutateAsync({
        id: statusTarget.id,
        payload: {
          status: statusTarget.newStatus as 'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED',
          changed_by: userId ?? 0,
          actual_return_date:
            statusTarget.newStatus === 'RETURNED' ? new Date(returnDate).toISOString() : undefined,
          resources_to_return: validResources.length > 0 ? validResources : undefined,
          notes: statusTarget.newStatus === 'RETURNED' && returnNotes ? returnNotes : undefined,
        },
      });
      toast('Status updated successfully', 'success');
      setStatusTarget(null);
      setReturnResources([{ resource_type_id: 0, amount: 0 }]);
      setReturnNotes('');
      setReturnError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Status change failed';
      setStatusConfirmError(message);
    }
  };

  const handleReturnSubmit = () => {
    setReturnError(null);
    if (!returnDate) {
      setReturnError('Return date is required');
      return;
    }
    confirmStatusChange();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync({
        id: deleteTarget.id,
        payload: { changed_by: userId ?? 0 },
      });
      toast('Exploration deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setDeleteError(message);
    }
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
        {campIsEmpty ? (
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
            <div className="flex flex-col sm:flex-row gap-3 mb-4 flex-wrap">
              <select
                value={campFilter}
                onChange={(e) => setCampFilter(e.target.value)}
                className="rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value="">ALL CAMPS</option>
                {campsArray.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value="">ALL STATUS</option>
                <option value="PLANNED">PLANNED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="RETURNED">RETURNED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
              {hasActiveFilters && (
                <GlitchButton variant="ghost" onClick={clearFilters}>
                  <span className="flex items-center gap-1.5">
                    <FilterX className="h-3 w-3" />
                    CLEAR
                  </span>
                </GlitchButton>
              )}
              <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW EXPLORATION
                </span>
              </GlitchButton>
            </div>

            {filterIsEmpty ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <FilterX className="h-8 w-8 text-[var(--neon-cyan)]/30" />
                <p className="font-mono-data text-sm text-muted-foreground">
                  NO EXPLORATIONS MATCH SELECTED FILTERS
                </p>
                <GlitchButton variant="ghost" onClick={clearFilters}>
                  CLEAR FILTERS
                </GlitchButton>
              </div>
            ) : (
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
                    {filteredExps.map((exp) => (
                      <tr
                        key={exp.id as number}
                        className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] cursor-pointer transition-colors"
                        onClick={() => navigate(`/explorations/${exp.id}`)}
                      >
                        <td className="py-3 px-2 text-[var(--neon-fuchsia)]">
                          {exp.destination as string}
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge
                            status={exp.status as string}
                            variant={STATUS_MAP[exp.status as string] || 'red'}
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
                          {campMap.get(exp.camp_id) || String(exp.camp_id)}
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={exp.status as string}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleStatusChange(
                                exp.id as number,
                                exp.destination as string,
                                exp.status as string,
                                e.target.value,
                              )
                            }
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                id: exp.id as number,
                                destination: exp.destination as string,
                              });
                            }}
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
            )}
          </>
        )}
      </Panel>

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
                {campsArray.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
            {watchedCampId > 0 && (
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  MEMBERS //
                </label>
                {availablePeople.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono-data">
                    No available people in selected camp
                    {unavailableCount > 0 && ` (${unavailableCount} unavailable)`}
                  </p>
                ) : (
                  <>
                    <div className="max-h-40 overflow-y-auto border border-[oklch(0.68_0.32_340_/_0.4)] rounded-sm">
                      {availablePeople.map((person) => (
                        <label
                          key={person.id as number}
                          className="flex items-center gap-2 px-3 py-1.5 hover:bg-[oklch(0.15_0.05_320_/_0.5)] cursor-pointer font-mono-data text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(person.id as number)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMembers((prev) => [...prev, person.id as number]);
                              } else {
                                setSelectedMembers((prev) =>
                                  prev.filter((id) => id !== (person.id as number)),
                                );
                              }
                            }}
                          />
                          <span className="text-foreground">{person.full_name as string}</span>
                        </label>
                      ))}
                    </div>
                  </>
                )}
                {selectedMembers.length > 0 && (
                  <p className="mt-1 text-[10px] text-muted-foreground font-mono-data">
                    {selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}
            {!watchedCampId && (
              <div className="flex items-center gap-2 p-3 border border-zinc-700 font-mono-data text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                Select a camp to choose members
              </div>
            )}
            <div className="flex items-center gap-2 p-3 border border-zinc-700 font-mono-data text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              Resource allocation is configured in the expedition return flow
            </div>
            <div className="flex items-center gap-2 p-3 border border-zinc-700 font-mono-data text-xs text-muted-foreground">
              <Gift className="h-3.5 w-3.5" />
              Found resources are recorded when marking the expedition as returned
            </div>
            {createError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {createError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  formCreate.reset();
                  setSelectedMembers([]);
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

      {statusTarget?.newStatus === 'RETURNED' ? (
        <Dialog open={!!statusTarget} onOpenChange={() => setStatusTarget(null)}>
          <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-sm tracking-widest text-glow-cyan">
                RETURN INTAKE — {statusTarget.destination}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  ACTUAL RETURN DATE //
                </label>
                <input
                  type="datetime-local"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
                />
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  RESOURCES RECOVERED //
                </label>
                <div className="space-y-2">
                  {returnResources.map((r, i) => (
                    <div
                      key={`ret-res-${i}`}
                      className="flex gap-2 items-end p-2 border border-zinc-700 rounded-sm"
                    >
                      <div className="flex-1">
                        <label className="text-[9px] text-muted-foreground">RESOURCE</label>
                        <select
                          value={r.resource_type_id}
                          onChange={(e) => {
                            const updated = [...returnResources];
                            updated[i] = {
                              ...updated[i],
                              resource_type_id: Number(e.target.value),
                            };
                            setReturnResources(updated);
                          }}
                          className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-zinc-700 px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                        >
                          <option value={0}>SELECT...</option>
                          {resourcesArray.map((res) => (
                            <option key={res.id} value={res.id}>
                              {res.name} ({res.unit})
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
                          value={r.amount || ''}
                          onChange={(e) => {
                            const updated = [...returnResources];
                            updated[i] = {
                              ...updated[i],
                              amount: Number(e.target.value),
                            };
                            setReturnResources(updated);
                          }}
                          className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-zinc-700 px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                        />
                      </div>
                      {returnResources.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setReturnResources((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="p-1 rounded-sm text-red-400 hover:bg-red-400/10 mb-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setReturnResources((prev) => [...prev, { resource_type_id: 0, amount: 0 }])
                  }
                  className="mt-2 text-[10px] text-brand-primary hover:text-brand-primary/80 font-mono-data"
                >
                  + ADD RESOURCE
                </button>
              </div>

              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  NOTES //
                </label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-zinc-700 px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data resize-none"
                />
              </div>

              {returnError && (
                <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                  {returnError}
                </div>
              )}
              {statusConfirmError && (
                <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                  {statusConfirmError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <GlitchButton
                  variant="ghost"
                  type="button"
                  onClick={() => {
                    setStatusTarget(null);
                    setReturnResources([{ resource_type_id: 0, amount: 0 }]);
                    setReturnNotes('');
                    setReturnError(null);
                  }}
                >
                  CANCEL
                </GlitchButton>
                <GlitchButton
                  variant="primary"
                  type="button"
                  onClick={handleReturnSubmit}
                  disabled={updateStatusMutation.isPending}
                >
                  {updateStatusMutation.isPending ? 'PROCESSING...' : 'CONFIRM RETURN'}
                </GlitchButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <AlertDialog open={!!statusTarget} onOpenChange={(open) => !open && setStatusTarget(null)}>
          <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
                CONFIRM STATUS CHANGE
              </AlertDialogTitle>
              <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground space-y-1.5">
                <div>
                  Change status of expedition to{' '}
                  <span className="text-[var(--neon-fuchsia)]">{statusTarget?.destination}</span>?
                </div>
                <div>
                  <StatusBadge status={statusTarget?.currentStatus || ''} variant="red" />
                  <span className="mx-1 text-muted-foreground">→</span>
                  <StatusBadge
                    status={statusTarget?.newStatus || ''}
                    variant={STATUS_MAP[statusTarget?.newStatus || ''] || 'red'}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            {statusConfirmError && (
              <div className="mx-6 mb-2 border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {statusConfirmError}
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] font-mono-data text-xs">
                CANCEL
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                disabled={updateStatusMutation.isPending}
                className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs hover:bg-[var(--neon-yellow)]/80"
              >
                {updateStatusMutation.isPending ? 'UPDATING...' : 'CONFIRM'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              CONFIRM DELETE
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              Delete expedition to{' '}
              <span className="text-[var(--neon-fuchsia)]">{deleteTarget?.destination}</span>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="mx-6 mb-2 border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
              {deleteError}
            </div>
          )}
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
