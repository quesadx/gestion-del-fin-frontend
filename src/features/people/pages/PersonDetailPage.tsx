import { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import {
  usePerson,
  useUpdatePerson,
  useDeletePerson,
  useAddPersonStatusLog,
  useCreateProfessionReassignment,
  useCreateContributionOverride,
} from '@/features/people/hooks/usePeople';
import { useCamp } from '@/features/camps/hooks/useCamps';
import { useProfessions } from '@/features/professions/hooks/useProfessions';
import { useResources } from '@/features/resources/hooks/useResources';
import { toast } from '@/shared/lib/toast';
import type { Profession } from '@/features/professions/types/profession.types';
import { ArrowLeft, Edit3, Trash2, Activity, Wrench } from 'lucide-react';
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

const updatePersonSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  age: z.coerce.number().min(0).optional(),
  identification_code: z.string().optional(),
  blood_type: z.string().optional(),
  skills_summary: z.string().optional(),
  photo_url: z.string().optional(),
  status: z.enum(['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD']).default('HEALTHY'),
  admitted_at: z.string().min(1, 'Admission date is required'),
});

type UpdatePersonFormValues = z.infer<typeof updatePersonSchema>;

const reassignSchema = z.object({
  to_profession_id: z.coerce.number().min(1, 'Select a profession'),
  reason: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type ReassignFormValues = z.infer<typeof reassignSchema>;

const statusLogSchema = z.object({
  new_status: z.enum(['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD']),
  reason: z.string().optional(),
});

type StatusLogFormValues = z.infer<typeof statusLogSchema>;

const contributionOverrideSchema = z.object({
  resource_type_id: z.coerce.number().min(1, 'Select a resource type'),
  amount: z.coerce.number().min(0, 'Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type ContributionOverrideFormValues = z.infer<typeof contributionOverrideSchema>;

function getStatusVariant(status: string): 'green' | 'amber' | 'red' | 'red' {
  switch (status) {
    case 'HEALTHY':
      return 'green';
    case 'SICK':
      return 'amber';
    case 'INJURED':
      return 'amber';
    case 'DEAD':
      return 'red';
    default:
      return 'red';
  }
}

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const personId = Number(id);
  const campIdFromQuery = Number(searchParams.get('campId')) || 0;

  const { data: person, isLoading, isError, error, refetch } = usePerson(campIdFromQuery, personId);
  const { data: camp } = useCamp(campIdFromQuery);
  const { data: professions } = useProfessions();
  const updateMutation = useUpdatePerson();
  const deleteMutation = useDeletePerson();
  const statusLogMutation = useAddPersonStatusLog();
  const reassignMutation = useCreateProfessionReassignment();
  const contributionOverrideMutation = useCreateContributionOverride();
  const { data: resources } = useResources();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [statusLogOpen, setStatusLogOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [statusLogError, setStatusLogError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [contributionError, setContributionError] = useState<string | null>(null);

  const statusLogs = person?.person_status_log ?? [];

  const editForm = useForm<UpdatePersonFormValues>({
    resolver: resolved(updatePersonSchema),
  });

  const statusLogForm = useForm<StatusLogFormValues>({
    resolver: resolved(statusLogSchema),
    defaultValues: { new_status: 'HEALTHY', reason: '' },
  });

  const reassignForm = useForm<ReassignFormValues>({
    resolver: resolved(reassignSchema),
    defaultValues: { to_profession_id: 0, reason: '', start_date: '', end_date: '' },
  });

  const contributionForm = useForm<ContributionOverrideFormValues>({
    resolver: resolved(contributionOverrideSchema),
    defaultValues: { resource_type_id: 0, amount: 0, reason: '', start_date: '', end_date: '' },
  });

  const handleOpenEdit = () => {
    if (person) {
      editForm.reset({
        full_name: person.full_name,
        age: person.age,
        identification_code: person.identification_code || '',
        blood_type: person.blood_type || '',
        skills_summary: person.skills_summary || '',
        photo_url: person.photo_url || '',
        status: person.status as 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD',
        admitted_at: person.admitted_at
          ? format(new Date(person.admitted_at), "yyyy-MM-dd'T'HH:mm")
          : '',
      });
    }
    setEditOpen(true);
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag={`PPL.${personId}`} status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load person'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="space-y-6">
        <Panel title="PERSON NOT FOUND" tag={`PPL.${personId}`} status="OFFLINE" accent="purple">
          <p className="text-sm text-muted-foreground font-mono-data">
            Requested person does not exist.
          </p>
        </Panel>
      </div>
    );
  }

  const onSubmitEdit = async (values: UpdatePersonFormValues) => {
    setEditError(null);
    try {
      await updateMutation.mutateAsync({
        campId: person.camp_id,
        id: personId,
        payload: {
          ...values,
          admitted_at: new Date(values.admitted_at).toISOString(),
          photo_url: values.photo_url || undefined,
        },
      });
      toast('Person updated successfully', 'success');
      setEditOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setEditError(message);
    }
  };

  const handleDelete = async () => {
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync({
        campId: person.camp_id as number,
        id: personId,
      });
      toast('Person deleted successfully', 'success');
      navigate('/people');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      const is409 = err instanceof Error && err.message.toLowerCase().includes('409');
      setDeleteError(
        is409
          ? 'Person cannot be deleted because related records exist (transfers, expeditions, etc.)'
          : message,
      );
    }
  };

  const onSubmitStatusLog = async (values: StatusLogFormValues) => {
    setStatusLogError(null);
    try {
      await statusLogMutation.mutateAsync({
        campId: person.camp_id as number,
        payload: { person_id: personId, ...values },
      });
      toast('Status updated successfully', 'success');
      setStatusLogOpen(false);
      statusLogForm.reset();
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Status log failed';
      setStatusLogError(message);
    }
  };

  const onSubmitReassign = async (values: ReassignFormValues) => {
    setReassignError(null);
    try {
      await reassignMutation.mutateAsync({
        campId: person.camp_id as number,
        payload: {
          person_id: personId,
          from_profession_id: person.profession_id as number,
          to_profession_id: values.to_profession_id,
          reason: values.reason || undefined,
          start_date: values.start_date || undefined,
          end_date: values.end_date || undefined,
        },
      });
      toast('Profession reassigned successfully', 'success');
      setReassignOpen(false);
      reassignForm.reset();
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Reassignment failed';
      setReassignError(message);
    }
  };

  const onSubmitContributionOverride = async (values: ContributionOverrideFormValues) => {
    setContributionError(null);
    try {
      await contributionOverrideMutation.mutateAsync({
        campId: person.camp_id as number,
        payload: {
          person_id: personId,
          resource_type_id: values.resource_type_id,
          amount: values.amount,
          reason: values.reason,
          start_date: values.start_date || undefined,
          end_date: values.end_date || undefined,
        },
      });
      toast('Contribution override created', 'success');
      setContributionOpen(false);
      contributionForm.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Override failed';
      setContributionError(message);
    }
  };

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/people')}>
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </span>
      </GlitchButton>

      <Panel
        title={person.full_name as string}
        tag={`PPL.${personId}`}
        status={person.status as string}
        accent="cyan"
      >
        <div className="text-[10px] font-mono text-zinc-500 mb-3">ID: {personId}</div>
        <div className="flex items-start gap-4 mb-4">
          {(person.photo_url as string) ? (
            <img
              src={person.photo_url as string}
              alt={person.full_name as string}
              className="w-16 h-16 rounded-sm object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-16 h-16 rounded-sm bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700">
              <span className="font-mono text-xl font-bold text-zinc-500">
                {(person.full_name as string)?.[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
          <div className="flex-1 space-y-2 font-mono-data text-xs">
            <div>
              <span className="text-muted-foreground">STATUS: </span>
              <StatusBadge
                status={person.status as string}
                variant={getStatusVariant(person.status as string)}
              />
            </div>
            <div>
              <span className="text-muted-foreground">PROFESSION: </span>
              <span className="text-[var(--neon-fuchsia)]">{person.professions?.name || '—'}</span>
            </div>
            <div>
              <span className="text-muted-foreground">CAMP: </span>
              {camp?.name || String(person.camp_id)}
            </div>
            <div>
              <span className="text-muted-foreground">ADMITTED: </span>
              {person.admitted_at
                ? format(new Date(person.admitted_at as string), 'dd/MM/yyyy')
                : '—'}
            </div>
          </div>
        </div>
        <div className="space-y-2 font-mono-data text-xs mb-4">
          <div>
            <span className="text-muted-foreground">AGE: </span>
            {(person.age as number) ?? '—'}
          </div>
          <div>
            <span className="text-muted-foreground">CODE: </span>
            {(person.identification_code as string) || '—'}
          </div>
          <div>
            <span className="text-muted-foreground">BLOOD TYPE: </span>
            {(person.blood_type as string) || '—'}
          </div>
        </div>
        {(person.skills_summary as string) && (
          <div className="font-mono-data text-xs">
            <span className="text-muted-foreground">SKILLS: </span>
            {person.skills_summary as string}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[oklch(0.68_0.32_340_/_0.2)]">
          <GlitchButton variant="ghost" onClick={handleOpenEdit}>
            <Edit3 className="h-3.5 w-3.5 mr-1" />
            EDIT
          </GlitchButton>
          <GlitchButton variant="ghost" onClick={() => setStatusLogOpen(true)}>
            <Activity className="h-3.5 w-3.5 mr-1" />
            CHANGE STATUS
          </GlitchButton>
          <GlitchButton variant="ghost" onClick={() => setReassignOpen(true)}>
            <Wrench className="h-3.5 w-3.5 mr-1" />
            REASSIGN PROFESSION
          </GlitchButton>
          <GlitchButton variant="warning" onClick={() => setDeleteTarget(true)}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            DELETE
          </GlitchButton>
          <GlitchButton variant="ghost" onClick={() => setContributionOpen(true)}>
            CONTRIB OVERRIDE
          </GlitchButton>
        </div>
      </Panel>

      {statusLogs && statusLogs.length > 0 ? (
        (() => {
          const validLogs = statusLogs.filter(
            (log) => log.id || (log.new_status && log.changed_at),
          );
          const skipped = statusLogs.length - validLogs.length;

          return (
            <Panel
              title="STATUS HISTORY"
              tag={`PPL.${personId}.LOGS`}
              status={`${statusLogs.length} RECORDS`}
              accent="cyan"
            >
              {skipped > 0 && (
                <div className="mb-3 border border-amber-500/30 bg-amber-950/20 p-2 font-mono-data text-[10px] text-amber-400">
                  {skipped} record(s) missing required identifiers and not shown
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono-data text-xs">
                  <thead>
                    <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                      <th className="py-2 px-2">STATUS</th>
                      <th className="py-2 px-2">DATE</th>
                      <th className="py-2 px-2">REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validLogs.map((log) => (
                      <tr
                        key={
                          log.id
                            ? String(log.id)
                            : `${log.new_status}-${log.changed_at}-${(log.reason as string) ?? ''}`
                        }
                        className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                      >
                        <td className="py-2 px-2">
                          <StatusBadge
                            status={log.new_status as string}
                            variant={getStatusVariant(log.new_status as string)}
                          />
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {log.changed_at
                            ? format(new Date(log.changed_at as string), 'dd/MM/yyyy HH:mm')
                            : '—'}
                        </td>
                        <td className="py-2 px-2 text-muted-foreground">
                          {(log.reason as string) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          );
        })()
      ) : (
        <Panel
          title="STATUS HISTORY"
          tag={`PPL.${personId}.LOGS`}
          status="0 RECORDS"
          accent="purple"
        >
          <p className="font-mono-data text-xs text-muted-foreground py-4 text-center">
            NO STATUS CHANGES RECORDED
          </p>
        </Panel>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              EDIT PERSON
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NAME //
              </label>
              <input
                {...editForm.register('full_name')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {editForm.formState.errors.full_name && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.full_name.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  AGE //
                </label>
                <input
                  {...editForm.register('age')}
                  type="number"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
                {editForm.formState.errors.age && (
                  <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                    {editForm.formState.errors.age.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  PROFESSION //
                </label>
                <div className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-muted-foreground font-mono-data">
                  {person.professions?.name || '—'}
                </div>
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                STATUS //
              </label>
              <select
                {...editForm.register('status')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="SICK">SICK</option>
                <option value="INJURED">INJURED</option>
                <option value="AWAY">AWAY</option>
                <option value="DEAD">DECEASED</option>
              </select>
              {editForm.formState.errors.status && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.status.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ADMITTED //
              </label>
              <input
                {...editForm.register('admitted_at')}
                type="datetime-local"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {editForm.formState.errors.admitted_at && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.admitted_at.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ID CODE //
              </label>
              <input
                {...editForm.register('identification_code')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {editForm.formState.errors.identification_code && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.identification_code.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                BLOOD TYPE //
              </label>
              <input
                {...editForm.register('blood_type')}
                placeholder="A+, O-, etc."
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {editForm.formState.errors.blood_type && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.blood_type.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                SKILLS //
              </label>
              <textarea
                {...editForm.register('skills_summary')}
                rows={3}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {editForm.formState.errors.skills_summary && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.skills_summary.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                PHOTO URL //
              </label>
              <input
                {...editForm.register('photo_url')}
                placeholder="https://example.com/photo.jpg"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {editForm.formState.errors.photo_url && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {editForm.formState.errors.photo_url.message}
                </p>
              )}
            </div>
            {editError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => setEditOpen(false)}>
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'SAVING...' : 'SAVE'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={statusLogOpen} onOpenChange={setStatusLogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              LOG STATUS CHANGE
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={statusLogForm.handleSubmit(onSubmitStatusLog)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NEW STATUS //
              </label>
              <select
                {...statusLogForm.register('new_status')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="SICK">SICK</option>
                <option value="INJURED">INJURED</option>
                <option value="AWAY">AWAY</option>
                <option value="DEAD">DECEASED</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                REASON //
              </label>
              <textarea
                {...statusLogForm.register('reason')}
                rows={3}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            {statusLogError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {statusLogError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setStatusLogOpen(false);
                  statusLogForm.reset();
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={statusLogMutation.isPending}>
                {statusLogMutation.isPending ? 'LOGGING...' : 'LOG'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              REASSIGN PROFESSION
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={reassignForm.handleSubmit(onSubmitReassign)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                CURRENT PROFESSION //
              </label>
              <div className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-muted-foreground font-mono-data">
                {person.professions?.name || '—'}
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NEW PROFESSION //
              </label>
              <select
                {...reassignForm.register('to_profession_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="">SELECT...</option>
                {(Array.isArray(professions) ? professions : []).map((prof: Profession) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.name}
                  </option>
                ))}
              </select>
              {reassignForm.formState.errors.to_profession_id && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {reassignForm.formState.errors.to_profession_id.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                REASON //
              </label>
              <textarea
                {...reassignForm.register('reason')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  START DATE //
                </label>
                <input
                  {...reassignForm.register('start_date')}
                  type="date"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  END DATE //
                </label>
                <input
                  {...reassignForm.register('end_date')}
                  type="date"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
            </div>
            {reassignError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {reassignError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setReassignOpen(false);
                  reassignForm.reset();
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={reassignMutation.isPending}>
                {reassignMutation.isPending ? 'REASSIGNING...' : 'REASSIGN'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(false)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              CONFIRM DELETE
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              Delete{' '}
              <span className="text-[var(--neon-fuchsia)]">{person.full_name as string}</span>? This
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
              className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs hover:bg-[var(--neon-yellow)]/80"
            >
              {deleteMutation.isPending ? 'DELETING...' : 'DELETE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={contributionOpen} onOpenChange={setContributionOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              CONTRIBUTION OVERRIDE
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={contributionForm.handleSubmit(onSubmitContributionOverride)}
            className="space-y-4"
          >
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                RESOURCE TYPE //
              </label>
              <select
                {...contributionForm.register('resource_type_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value={0}>Select a resource...</option>
                {(resources ?? []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                AMOUNT //
              </label>
              <input
                {...contributionForm.register('amount')}
                type="number"
                min={0}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                REASON //
              </label>
              <input
                {...contributionForm.register('reason')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  START DATE //
                </label>
                <input
                  {...contributionForm.register('start_date')}
                  type="date"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  END DATE //
                </label>
                <input
                  {...contributionForm.register('end_date')}
                  type="date"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
            </div>
            {contributionError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {contributionError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setContributionOpen(false);
                  contributionForm.reset();
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton
                variant="primary"
                type="submit"
                disabled={contributionOverrideMutation.isPending}
              >
                {contributionOverrideMutation.isPending ? 'SENDING...' : 'OVERRIDE'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
