import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { TacticalButton } from '@/components/tactical/TacticalButton';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamps } from '@/features/camps/hooks/useCamps';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useRoles,
} from '@/features/users/hooks/useUsers';
import type { RoleItem, UpdateUserDto } from '@/features/users/api/users.api';
import type { User } from '@/features/users/types/user.types';
import { toast } from '@/shared/lib/toast';
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

const ROLE_DISPLAY_LABEL: Record<string, string> = {
  system_admin: 'ADMIN',
  worker: 'WORKER',
  resource_manager: 'MANAGER',
  travel_coordinator: 'TRAVEL_LEAD',
};

export function UsersPage() {
  const { data: users, isLoading, isError, error, refetch } = useUsers();
  const { data: camps } = useCamps();
  const { data: roles } = useRoles();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; username: string } | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const campsArray = camps?.data ?? [];
  const usersArray = Array.isArray(users) ? users : [];
  const rolesArray: RoleItem[] = Array.isArray(roles) ? roles : [];
  const campMap = new Map<number, string>();
  campsArray.forEach((c) => campMap.set(c.id, c.name));

  const createForm = useForm<CreateFormValues>({
    resolver: resolved(createUserSchema),
    defaultValues: { username: '', password: '', camp_id: 0, role_id: 0 },
  });

  const editForm = useForm<UpdateFormValues>({
    resolver: resolved(updateUserSchema),
    defaultValues: { username: '', password: '', camp_id: 0, role_id: 0, is_active: true },
  });

  const openEdit = (u: User) => {
    editForm.reset({
      username: u.username,
      password: '',
      camp_id: u.camp_id,
      role_id: u.role_id,
      is_active: u.is_active,
    });
    setEditTarget(u);
  };

  const roleNameById = (roleId: number): string => {
    const found = rolesArray.find((r) => r.id === roleId);
    return found ? found.name : '';
  };

  const roleLabel = (roleId: number): string => {
    const name = roleNameById(roleId);
    if (!name) return `ROLE_${roleId}`;
    return ROLE_DISPLAY_LABEL[name] || name.toUpperCase();
  };

  const onSubmitCreate = async (values: CreateFormValues) => {
    setCreateError(null);
    try {
      await createMutation.mutateAsync(values);
      toast('User created successfully', 'success');
      setCreateOpen(false);
      createForm.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Creation failed';
      setCreateError(message);
    }
  };

  const onSubmitEdit = async (values: UpdateFormValues) => {
    if (!editTarget) return;
    setEditError(null);
    const payload: Partial<UpdateFormValues> = { ...values };
    if (!payload.password) delete payload.password;
    try {
      await updateMutation.mutateAsync({
        id: editTarget.id,
        payload: payload as UpdateUserDto,
      });
      toast('User updated successfully', 'success');
      setEditTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setEditError(message);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await updateMutation.mutateAsync({
        id: u.id,
        payload: { is_active: !u.is_active },
      });
      toast(
        u.is_active ? 'User deactivated successfully' : 'User activated successfully',
        'success',
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Toggle failed';
      toast(message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast('User deleted successfully', 'success');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      setDeleteError(message);
    }
  };

  if (isLoading) return <HoloLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <GlassPanel title="ERROR" tag="USR.01" status="ERROR" accent="amber">
          <p className="text-sm text-red-400 font-sans text-xs mb-4">
            {(error as Error)?.message || 'Failed to load users'}
          </p>
          <TacticalButton variant="warning" onClick={() => refetch()}>
            RETRY
          </TacticalButton>
        </GlassPanel>
      </div>
    );
  }

  const getBadgeVariant = (isActive: boolean): 'green' | 'red' => (isActive ? 'green' : 'red');

  return (
    <div className="space-y-6">
      <GlassPanel
        title="USER MANAGEMENT"
        tag="USR.01"
        status={isLoading ? 'LOADING' : usersArray.length.toString()}
        accent="cyan"
      >
        {usersArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Shield className="h-10 w-10 text-gdf-accent-secondary/40" />
            <p className="font-sans text-xs text-sm text-muted-foreground">NO USERS REGISTERED</p>
            <TacticalButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                NEW USER
              </span>
            </TacticalButton>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <TacticalButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW USER
                </span>
              </TacticalButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-sans text-xs text-xs">
                <thead>
                  <tr className="border-b border-gdf-border-subtle text-muted-foreground">
                    <th className="py-3 px-2">USER</th>
                    <th className="py-3 px-2">CAMP</th>
                    <th className="py-3 px-2">ROLE</th>
                    <th className="py-3 px-2">STATUS</th>
                    <th className="py-3 px-2">LAST ACTIVITY</th>
                    <th className="py-3 px-2 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {usersArray.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-gdf-border-subtle hover:bg-gdf-surface-hover transition-colors"
                    >
                      <td className="py-3 px-2 text-gdf-accent-primary">{u.username}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {campMap.get(u.camp_id) || String(u.camp_id)}
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge status={roleLabel(u.role_id)} variant="amber" />
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge
                          status={u.is_active ? 'ACTIVE' : 'INACTIVE'}
                          variant={getBadgeVariant(u.is_active)}
                        />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {u.last_activity
                          ? format(new Date(u.last_activity), 'dd/MM/yyyy HH:mm')
                          : '—'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(u)}
                            className="p-1.5 rounded-md text-gdf-accent-secondary hover:bg-[oklch(0.85_0.22_200_/_0.1)] transition-colors"
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
                            className="p-1.5 rounded-md text-gdf-status-warning hover:bg-[var(--neon-yellow)]/10 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget({
                                id: u.id,
                                username: u.username,
                              })
                            }
                            className="p-1.5 rounded-md text-red-400 hover:bg-red-400/10 transition-colors"
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
      </GlassPanel>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-gdf-surface-overlay/95 border border-gdf-border-default text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-normal text-glow-fuchsia">
              NEW USER
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                USERNAME //
              </label>
              <input
                {...createForm.register('username')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-primary font-sans text-xs"
              />
              {createForm.formState.errors.username && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {createForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                PASSWORD //
              </label>
              <input
                {...createForm.register('password')}
                type="password"
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              />
              {createForm.formState.errors.password && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                CAMP //
              </label>
              <select
                {...createForm.register('camp_id')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-primary font-sans text-xs"
              >
                <option value="">SELECT...</option>
                {campsArray.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {createForm.formState.errors.camp_id && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {createForm.formState.errors.camp_id.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                ROLE //
              </label>
              <select
                {...createForm.register('role_id')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-primary font-sans text-xs"
              >
                <option value="">SELECT...</option>
                {rolesArray.map((r) => (
                  <option key={r.id} value={r.id}>
                    {ROLE_DISPLAY_LABEL[r.name] || r.name.toUpperCase()}
                  </option>
                ))}
              </select>
              {createForm.formState.errors.role_id && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {createForm.formState.errors.role_id.message}
                </p>
              )}
            </div>
            {createError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-sans text-xs text-[10px] text-red-400">
                {createError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <TacticalButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  createForm.reset();
                }}
              >
                CANCEL
              </TacticalButton>
              <TacticalButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREATING...' : 'CREATE'}
              </TacticalButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="bg-gdf-surface-overlay/95 border border-gdf-border-default text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-normal text-glow-cyan">
              EDIT USER
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                USERNAME //
              </label>
              <input
                {...editForm.register('username')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              />
              {editForm.formState.errors.username && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {editForm.formState.errors.username.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                NEW PASSWORD (OPTIONAL) //
              </label>
              <input
                {...editForm.register('password')}
                type="password"
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                CAMP //
              </label>
              <select
                {...editForm.register('camp_id')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              >
                <option value="">SELECT...</option>
                {campsArray.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {editForm.formState.errors.camp_id && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {editForm.formState.errors.camp_id.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                ROLE //
              </label>
              <select
                {...editForm.register('role_id')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              >
                {rolesArray.map((r) => (
                  <option key={r.id} value={r.id}>
                    {ROLE_DISPLAY_LABEL[r.name] || r.name.toUpperCase()}
                  </option>
                ))}
              </select>
              {editForm.formState.errors.role_id && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {editForm.formState.errors.role_id.message}
                </p>
              )}
            </div>
            {editError && (
              <div className="border border-red-500/30 bg-red-950/30 p-2 font-sans text-xs text-[10px] text-red-400">
                {editError}
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <TacticalButton variant="ghost" type="button" onClick={() => setEditTarget(null)}>
                CANCEL
              </TacticalButton>
              <TacticalButton variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'SAVING...' : 'SAVE'}
              </TacticalButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-gdf-surface-overlay/95 border border-gdf-border-default text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-normal text-gdf-status-warning">
              CONFIRM DELETE
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-xs text-xs text-muted-foreground">
              Delete user <span className="text-gdf-accent-primary">{deleteTarget?.username}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <div className="mx-6 mb-2 border border-red-500/30 bg-red-950/30 p-2 font-sans text-xs text-[10px] text-red-400">
              {deleteError}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-[var(--neon-cyan)] text-gdf-accent-secondary hover:bg-[oklch(0.85_0.22_200_/_0.1)] font-sans text-xs text-xs">
              CANCEL
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-sans text-xs text-xs"
            >
              {deleteMutation.isPending ? 'DELETING...' : 'DELETE'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
