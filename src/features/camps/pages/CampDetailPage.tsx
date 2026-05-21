import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamp, useUpdateCamp } from '@/features/camps/hooks/useCamps';
import { usePeople } from '@/features/people/hooks/usePeople';
import { toast } from '@/shared/lib/toast';
import { ArrowLeft, Users, Edit3, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const updateCampSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'ABANDONED']),
  ai_context_prompt: z.string().optional(),
});

type UpdateCampFormValues = z.infer<typeof updateCampSchema>;

export function CampDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const campId = Number(id);
  const isValidId = Number.isFinite(campId) && campId > 0;
  const { data: camp, isLoading, isError, error, refetch } = useCamp(isValidId ? campId : 0);
  const {
    data: people,
    isLoading: peopleLoading,
    isError: peopleError,
  } = usePeople(isValidId ? campId : 0, { page: 1, limit: 10 });
  const updateCampMutation = useUpdateCamp();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateCampFormValues>({
    resolver: resolved(updateCampSchema),
    defaultValues: { name: '', location: '', status: 'ACTIVE', ai_context_prompt: '' },
  });

  const openEdit = () => {
    if (camp) {
      reset({
        name: camp.name as string,
        location: (camp.location as string) || '',
        status: camp.status as 'ACTIVE' | 'ABANDONED',
        ai_context_prompt: (camp.ai_context_prompt as string) || '',
      });
      setEditDialogOpen(true);
    }
  };

  const onSubmitEdit = async (values: UpdateCampFormValues) => {
    setEditError(null);
    try {
      await updateCampMutation.mutateAsync({ id: campId, payload: values });
      toast('Camp updated successfully', 'success');
      setEditDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setEditError(message);
    }
  };

  if (!isValidId) {
    return (
      <div className="space-y-6">
        <Panel title="INVALID CAMP ID" tag="CAMP.ERR" status="ERROR" accent="purple">
          <p className="text-sm text-muted-foreground font-mono-data">
            The camp ID in the URL is not valid.
          </p>
          <div className="mt-4">
            <GlitchButton variant="ghost" onClick={() => navigate('/camps')}>
              BACK TO CAMPS
            </GlitchButton>
          </div>
        </Panel>
      </div>
    );
  }

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag={`CAMP.${campId}`} status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load camp'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="space-y-6">
        <Panel title="CAMP NOT FOUND" tag={`CAMP.${campId}`} status="OFFLINE" accent="purple">
          <p className="text-sm text-muted-foreground font-mono-data">
            Requested camp does not exist.
          </p>
        </Panel>
      </div>
    );
  }

  const statusVariant = camp.status === 'ACTIVE' ? 'green' : 'red';
  const peopleArray = people?.data ?? [];
  const peopleTotal = people?.pagination?.total;

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/camps')}>
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </span>
      </GlitchButton>

      <Panel
        title={camp.name as string}
        tag={`CAMP.${campId}`}
        status={camp.status as string}
        accent={statusVariant}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-mono-data text-xs">
              <MapPin className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              <span className="text-muted-foreground">LOCATION:</span>
              <span className="text-foreground">
                {(camp.location as string) || 'NOT SPECIFIED'}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono-data text-xs">
              <Calendar className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              <span className="text-muted-foreground">CREATED:</span>
              <span className="text-foreground">
                {camp.created_at
                  ? format(new Date(camp.created_at as string), 'dd/MM/yyyy HH:mm')
                  : '—'}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono-data text-xs">
              <StatusBadge status={camp.status as string} variant={statusVariant} />
            </div>
          </div>
          <div className="flex justify-end items-start">
            <GlitchButton variant="ghost" onClick={openEdit}>
              <span className="flex items-center gap-2">
                <Edit3 className="h-3.5 w-3.5" />
                EDIT
              </span>
            </GlitchButton>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-[oklch(0.68_0.32_340_/_0.2)]">
          {(camp.ai_context_prompt as string) ? (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 font-mono-data text-xs">
              <p className="text-muted-foreground mb-1">AI CONTEXT PROMPT:</p>
              <p className="text-foreground whitespace-pre-wrap">
                {camp.ai_context_prompt as string}
              </p>
            </div>
          ) : (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 font-mono-data text-xs">
              <p className="text-muted-foreground">AI CONTEXT PROMPT: NO AI CONTEXT CONFIGURED</p>
            </div>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Panel accent="cyan">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-[var(--neon-cyan)]" />
            <div>
              <p className="font-mono-data text-[10px] text-muted-foreground">PEOPLE</p>
              <p className="font-display text-lg text-glow-cyan">
                {peopleTotal ?? peopleArray.length}
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel
        title="PEOPLE IN CAMP"
        tag={`CAMP.${campId}.PEOPLE`}
        status={peopleLoading ? 'LOADING' : 'ONLINE'}
        accent="cyan"
      >
        {peopleLoading ? (
          <p className="text-sm text-muted-foreground font-mono-data">Loading people...</p>
        ) : peopleError ? (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-red-400 font-mono-data">Failed to load people</p>
          </div>
        ) : peopleArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Users className="h-8 w-8 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO PEOPLE IN THIS CAMP</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2 font-semibold">NAME</th>
                    <th className="py-3 px-2 font-semibold">PROFESSION</th>
                    <th className="py-3 px-2 font-semibold">STATUS</th>
                    <th className="py-3 px-2 font-semibold">ADMITTED</th>
                  </tr>
                </thead>
                <tbody>
                  {peopleArray.slice(0, 10).map((person) => (
                    <tr
                      key={person.id as number}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">
                        {person.full_name as string}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {person.professions?.name || '—'}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge
                          status={person.status as string}
                          variant={
                            person.status === 'HEALTHY'
                              ? 'green'
                              : person.status === 'SICK'
                                ? 'amber'
                                : person.status === 'INJURED'
                                  ? 'amber'
                                  : person.status === 'DEAD'
                                    ? 'red'
                                    : 'red'
                          }
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {person.admitted_at
                          ? format(new Date(person.admitted_at as string), 'dd/MM/yyyy')
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex justify-end">
              <GlitchButton variant="ghost" onClick={() => navigate(`/people?campId=${campId}`)}>
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3" />
                  VIEW ALL PEOPLE
                </span>
              </GlitchButton>
            </div>
          </>
        )}
      </Panel>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              EDIT CAMP
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NAME //
              </label>
              <input
                {...register('name')}
                type="text"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {errors.name && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                LOCATION //
              </label>
              <input
                {...register('location')}
                type="text"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {errors.location && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {errors.location.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                STATUS //
              </label>
              <select
                {...register('status')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ABANDONED">ABANDONED</option>
              </select>
              {errors.status && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {errors.status.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                AI CONTEXT PROMPT //
              </label>
              <textarea
                {...register('ai_context_prompt')}
                rows={4}
                placeholder="Camp rules for AI admission evaluation..."
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data resize-y"
              />
            </div>
            {editError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => setEditDialogOpen(false)}>
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={updateCampMutation.isPending}>
                {updateCampMutation.isPending ? 'SAVING...' : 'SAVE'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
