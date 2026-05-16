import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamps, useCreateCamp, useDeleteCamp } from '@/features/camps/hooks/useCamps';
import { toast } from '@/shared/lib/toast';
import { MapPin, Plus, Trash2, Eye } from 'lucide-react';
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

const createCampSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().optional(),
  status: z.enum(['ACTIVE', 'ABANDONED']).default('ACTIVE'),
  ai_context_prompt: z.string().optional(),
});

type CreateCampFormValues = z.infer<typeof createCampSchema>;

export function CampsPage() {
  const navigate = useNavigate();
  const { data: camps, isLoading, isError, error, refetch } = useCamps();
  const createCampMutation = useCreateCamp();
  const deleteCampMutation = useDeleteCamp();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCampFormValues>({
    resolver: resolved(createCampSchema),
    defaultValues: { name: '', location: '', status: 'ACTIVE', ai_context_prompt: '' },
  });

  const onSubmitCreate = async (values: CreateCampFormValues) => {
    setCreateError(null);
    try {
      await createCampMutation.mutateAsync(values);
      toast('Camp created successfully', 'success');
      reset();
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      setCreateError(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteCampMutation.mutateAsync(deleteTarget.id);
      toast('Camp deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setDeleteError(message);
    }
  };

  const getStatusVariant = (status: string): 'green' | 'cyan' | 'red' => {
    if (status === 'ACTIVE') return 'green';
    if (status === 'ABANDONED') return 'red';
    return 'cyan';
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="ERR.01" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load camps'}
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
      <Panel title="CAMP_DIRECTORY" tag="CAMP.01" status="ONLINE" accent="cyan">
        {!camps || !Array.isArray(camps) || camps.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <MapPin className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO CAMPS REGISTERED</p>
            <GlitchButton variant="primary" onClick={() => setCreateDialogOpen(true)}>
              NEW CAMP
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2 font-semibold">NAME</th>
                    <th className="py-3 px-2 font-semibold">LOCATION</th>
                    <th className="py-3 px-2 font-semibold">STATUS</th>
                    <th className="py-3 px-2 font-semibold">CREATED</th>
                    <th className="py-3 px-2 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {camps.map((camp: Record<string, unknown>, i: number) => (
                    <tr
                      key={camp.id as number}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] cursor-pointer transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 50}ms`, animationFillMode: 'backwards' }}
                      onClick={() => navigate(`/camps/${camp.id}`)}
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)] font-bold">
                        {camp.name as string}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {(camp.location as string) || '—'}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge
                          status={camp.status as string}
                          variant={getStatusVariant(camp.status as string)}
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {camp.created_at
                          ? format(new Date(camp.created_at as string), 'dd/MM/yyyy')
                          : '—'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/camps/${camp.id}`);
                            }}
                            className="p-1.5 rounded-sm text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget({
                                id: camp.id as number,
                                name: camp.name as string,
                              });
                            }}
                            className="p-1.5 rounded-sm text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateDialogOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW CAMP
                </span>
              </GlitchButton>
            </div>
          </>
        )}
      </Panel>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              NEW CAMP
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NAME //
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="NORTH CAMP"
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
                placeholder="SECTOR 7G - NORTH ZONE"
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
                placeholder="Camp rules for AI evaluation..."
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data resize-y"
              />
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
                  reset();
                  setCreateDialogOpen(false);
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={createCampMutation.isPending}>
                {createCampMutation.isPending ? 'CREATING...' : 'CREATE'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              CONFIRM DELETE
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              Delete camp <span className="text-[var(--neon-fuchsia)]">{deleteTarget?.name}</span>?
              This action cannot be undone.
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
              disabled={deleteCampMutation.isPending}
              className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs hover:bg-[var(--neon-yellow)]/80"
            >
              {deleteCampMutation.isPending ? 'DELETING...' : 'DELETE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
