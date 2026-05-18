import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import {
  useProfessions,
  useCreateProfession,
  useUpdateProfession,
  useDeleteProfession,
} from '@/features/professions/hooks/useProfessions';
import { toast } from '@/shared/lib/toast';
import { Plus, Edit3, Trash2, Wrench } from 'lucide-react';
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

const professionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

type ProfessionFormValues = z.infer<typeof professionSchema>;

export function ProfessionsPage() {
  const { data: professions, isLoading, isError, error, refetch } = useProfessions();
  const createMutation = useCreateProfession();
  const updateMutation = useUpdateProfession();
  const deleteMutation = useDeleteProfession();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: number;
    name: string;
    description?: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const formCreate = useForm<ProfessionFormValues>({
    resolver: resolved(professionSchema),
    defaultValues: { name: '', description: '' },
  });

  const formEdit = useForm<ProfessionFormValues>({
    resolver: resolved(professionSchema),
    defaultValues: { name: '', description: '' },
  });

  const openEdit = (item: { id: number; name: string; description?: string }) => {
    formEdit.reset({ name: item.name, description: item.description || '' });
    setEditTarget(item);
  };

  const onSubmitCreate = async (values: ProfessionFormValues) => {
    setCreateError(null);
    try {
      await createMutation.mutateAsync(values);
      toast('Profession created successfully', 'success');
      formCreate.reset();
      setCreateDialogOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      setCreateError(message);
    }
  };

  const onSubmitEdit = async (values: ProfessionFormValues) => {
    if (!editTarget) return;
    setEditError(null);
    try {
      await updateMutation.mutateAsync({ id: editTarget.id, payload: values });
      toast('Profession updated successfully', 'success');
      setEditTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setEditError(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast('Profession deleted successfully', 'success');
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
        <Panel title="ERROR" tag="PRF.ERR" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load professions'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  const items = Array.isArray(professions) ? professions : [];

  return (
    <div className="space-y-6">
      <Panel title="PROFESSION_CATALOG" tag="PRF.01" status="ONLINE" accent="cyan">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Wrench className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              NO PROFESSIONS REGISTERED
            </p>
            <GlitchButton variant="primary" onClick={() => setCreateDialogOpen(true)}>
              NEW PROFESSION
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2 font-semibold">NAME</th>
                    <th className="py-3 px-2 font-semibold">DESCRIPTION</th>
                    <th className="py-3 px-2 font-semibold text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: Record<string, unknown>) => (
                    <tr
                      key={item.id as number}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)] font-bold">
                        {item.name as string}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {(item.description as string) || '—'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit({
                                id: item.id as number,
                                name: item.name as string,
                                description: item.description as string | undefined,
                              })
                            }
                            className="p-1.5 rounded-sm text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({ id: item.id as number, name: item.name as string })
                            }
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
                  NEW PROFESSION
                </span>
              </GlitchButton>
            </div>
          </>
        )}
      </Panel>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              NEW PROFESSION
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formCreate.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NAME //
              </label>
              <input
                {...formCreate.register('name')}
                type="text"
                placeholder="ENGINEER"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {formCreate.formState.errors.name && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formCreate.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                DESCRIPTION //
              </label>
              <textarea
                {...formCreate.register('description')}
                placeholder="PROFESSION DESCRIPTION"
                rows={3}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data resize-none"
              />
              {formCreate.formState.errors.description && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formCreate.formState.errors.description.message}
                </p>
              )}
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
                  setCreateDialogOpen(false);
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

      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              EDIT PROFESSION
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formEdit.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NAME //
              </label>
              <input
                {...formEdit.register('name')}
                type="text"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {formEdit.formState.errors.name && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formEdit.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                DESCRIPTION //
              </label>
              <textarea
                {...formEdit.register('description')}
                rows={3}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data resize-none"
              />
              {formEdit.formState.errors.description && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formEdit.formState.errors.description.message}
                </p>
              )}
            </div>
            {editError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-mono-data text-[10px] text-red-400">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => setEditTarget(null)}>
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'SAVING...' : 'SAVE'}
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
              Delete profession{' '}
              <span className="text-[var(--neon-fuchsia)]">{deleteTarget?.name}</span>? This action
              cannot be undone.
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
    </div>
  );
}
