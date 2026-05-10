import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamps } from '@/features/camps/hooks/useCamps';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from '@/features/users/hooks/useUsers';
import { Shield, Plus, Edit3, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
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

const createUserSchema = z.object({
  username: z.string().min(3, 'Minimum 3 characters'),
  password: z.string().min(6, 'Minimum 6 characters'),
  camp_id: z.coerce.number().min(1, 'Select a camp'),
  role_id: z.coerce.number().min(1, 'Select a role'),
});

const updateUserSchema = z.object({
  username: z.string().min(3, 'Minimum 3 characters'),
  password: z.string().optional(),
  camp_id: z.coerce.number().min(1, 'Select a camp'),
  role_id: z.coerce.number().min(1, 'Select a role'),
  is_active: z.boolean(),
});

type CreateFormValues = z.infer<typeof createUserSchema>;
type UpdateFormValues = z.infer<typeof updateUserSchema>;

export function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const { data: camps } = useCamps();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; username: string } | null>(null);

  const campsArray = Array.isArray(camps) ? camps : [];
  const usersArray = Array.isArray(users) ? users : [];
  const campMap = new Map<number, string>();
  campsArray.forEach((c: Record<string, unknown>) => campMap.set(c.id as number, c.name as string));

  const createForm = useForm<CreateFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { username: '', password: '', camp_id: 0, role_id: 0 },
  });

  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: { username: '', password: '', camp_id: 0, role_id: 0, is_active: true },
  });

  const openEdit = (u: Record<string, unknown>) => {
    editForm.reset({
      username: u.username as string,
      password: '',
      camp_id: u.camp_id as number,
      role_id: u.role_id as number,
      is_active: u.is_active as boolean,
    });
    setEditTarget(u);
  };

  const onSubmitCreate = async (values: CreateFormValues) => {
    await createMutation.mutateAsync(values);
    setCreateOpen(false);
    createForm.reset();
  };

  const onSubmitEdit = async (values: UpdateFormValues) => {
    if (!editTarget) return;
    const payload: Record<string, unknown> = { ...values };
    if (!payload.password) delete payload.password;
    await updateMutation.mutateAsync({
      id: editTarget.id as number,
      payload: payload as Parameters<typeof updateMutation.mutateAsync>[0]['payload'],
    });
    setEditTarget(null);
  };

  const handleToggleActive = async (u: Record<string, unknown>) => {
    await updateMutation.mutateAsync({
      id: u.id as number,
      payload: {
        username: u.username as string,
        camp_id: u.camp_id as number,
        role_id: u.role_id as number,
        is_active: !(u.is_active as boolean),
      },
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const roleLabel = (roleId: number) => {
    const map: Record<number, string> = { 1: 'ADMIN', 2: 'MANAGER', 3: 'WORKER', 4: 'TRAVEL_LEAD' };
    return map[roleId] || `ROLE_${roleId}`;
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="USR.01" status="ERROR" accent="fuchsia">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load users'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  const getBadgeVariant = (isActive: boolean): 'green' | 'red' => (isActive ? 'green' : 'red');

  return (
    <div className="space-y-6">
      <Panel
        title="USER MANAGEMENT"
        tag="USR.01"
        status={isLoading ? 'LOADING' : usersArray.length.toString()}
        accent="cyan"
      >
        {usersArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Shield className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO USERS REGISTERED</p>
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                NEW USER
              </span>
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW USER
                </span>
              </GlitchButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2">USER</th>
                    <th className="py-3 px-2">CAMP</th>
                    <th className="py-3 px-2">ROLE</th>
                    <th className="py-3 px-2">STATUS</th>
                    <th className="py-3 px-2">LAST ACTIVITY</th>
                    <th className="py-3 px-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {usersArray.map((u: Record<string, unknown>) => (
                    <tr
                      key={u.id as number}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">
                        {u.username as string}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {campMap.get(u.camp_id as number) || (u.camp_id as string)}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={roleLabel(u.role_id as number)} variant="fuchsia" />
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge
                          status={u.is_active ? 'ACTIVE' : 'INACTIVE'}
                          variant={getBadgeVariant(u.is_active as boolean)}
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {u.last_activity
                          ? format(new Date(u.last_activity as string), 'dd/MM/yyyy HH:mm')
                          : '—'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className="p-1.5 rounded-sm text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] transition-colors"
                            title={u.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {u.is_active ? (
                              <ToggleRight className="h-3.5 w-3.5" />
                            ) : (
                              <ToggleLeft className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="p-1.5 rounded-sm text-[var(--neon-yellow)] hover:bg-[var(--neon-yellow)]/10 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                id: u.id as number,
                                username: u.username as string,
                              })
                            }
                            className="p-1.5 rounded-sm text-red-400 hover:bg-red-400/10 transition-colors"
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
          </>
        )}
      </Panel>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              NEW USER
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                USERNAME //
              </label>
              <input
                {...createForm.register('username')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {createForm.formState.errors.username && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {createForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                PASSWORD //
              </label>
              <input
                {...createForm.register('password')}
                type="password"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {createForm.formState.errors.password && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                CAMP //
              </label>
              <select
                {...createForm.register('camp_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="">SELECT...</option>
                {campsArray.map((c: Record<string, unknown>) => (
                  <option key={c.id as number} value={c.id as number}>
                    {c.name as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ROLE //
              </label>
              <select
                {...createForm.register('role_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="">SELECT...</option>
                <option value="1">ADMIN</option>
                <option value="2">MANAGER</option>
                <option value="3">WORKER</option>
                <option value="4">TRAVEL_LEAD</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  createForm.reset();
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

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-cyan">
              EDIT USER
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                USERNAME //
              </label>
              <input
                {...editForm.register('username')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NEW PASSWORD (OPTIONAL) //
              </label>
              <input
                {...editForm.register('password')}
                type="password"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                CAMP //
              </label>
              <select
                {...editForm.register('camp_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value="">SELECT...</option>
                {campsArray.map((c: Record<string, unknown>) => (
                  <option key={c.id as number} value={c.id as number}>
                    {c.name as string}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ROLE //
              </label>
              <select
                {...editForm.register('role_id')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              >
                <option value="1">ADMIN</option>
                <option value="2">MANAGER</option>
                <option value="3">WORKER</option>
                <option value="4">TRAVEL_LEAD</option>
              </select>
            </div>
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

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              CONFIRM DELETE
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              Delete user{' '}
              <span className="text-[var(--neon-fuchsia)]">{deleteTarget?.username}</span>? This
              action cannot be undone.
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
