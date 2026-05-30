import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Permission } from '../../types';
import { Key, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 10;

export default function PermissionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [deletingPermission, setDeletingPermission] = useState<Permission | null>(null);
  const [page, setPage] = useState(1);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canCreatePerm = hasPermission(user?.permissions, 'permissions.create');
  const canUpdatePerm = hasPermission(user?.permissions, 'permissions.update');
  const canDeletePerm = hasPermission(user?.permissions, 'permissions.delete');

  const { data: permissions, isLoading } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get('/permissions');
      return res.data?.data ?? res.data;
    },
    enabled: hasPermission(user?.permissions, 'permissions.read'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await apiClient.post('/permissions', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name?: string; description?: string };
    }) => {
      const res = await apiClient.put(`/permissions/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/permissions/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setDeletingPermission(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPermission(null);
    setName('');
    setDescription('');
  };

  const openCreateModal = () => {
    setEditingPermission(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (permission: Permission) => {
    setEditingPermission(permission);
    setName(permission.name);
    setDescription(permission.description || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload = { name, description: description || undefined };

    if (editingPermission) {
      updateMutation.mutate({ id: editingPermission.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const totalPages = Math.max(1, Math.ceil((permissions?.length ?? 0) / PAGE_SIZE));
  const paginatedPermissions = (permissions ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Permissions
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Define granular access control permissions
          </p>
        </div>
        {canCreatePerm && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW PERMISSION
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 bg-surface-raised/40 brutalist-border rounded-xl space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {permissions?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Key size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No permissions defined</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Register the first permission to begin configuring access
              </p>
            </div>
          )}
          {paginatedPermissions.map((permission) => (
            <motion.div
              key={permission.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised brutalist-border p-5 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 shrink-0">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white font-mono">
                    {permission.name}
                  </h3>
                  {permission.description && (
                    <p className="text-xs font-mono text-zinc-500 mt-0.5">
                      {permission.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canUpdatePerm && (
                  <button
                    onClick={() => openEditModal(permission)}
                    aria-label={`Edit ${permission.name}`}
                    title={`Edit ${permission.name}`}
                    className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
                {canDeletePerm && (
                  <button
                    onClick={() => setDeletingPermission(permission)}
                    aria-label={`Delete ${permission.name}`}
                    title={`Delete ${permission.name}`}
                    className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400 touch-target"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    PERMISSION REGISTRY PR-02
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingPermission ? 'Edit Permission' : 'Register New Permission'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {editingPermission
                      ? 'Modify permission name and description.'
                      : 'Define a new access control permission key.'}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  title="Close modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Permission Key <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    aria-label="Permission key"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. inventory.read"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Description
                  </label>
                  <textarea
                    aria-label="Permission description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this permission grants access to"
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none font-mono"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'PROCESSING...'
                      : editingPermission
                        ? 'UPDATE RECORD'
                        : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingPermission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-950/40 rounded-lg flex items-center justify-center text-red-500 border border-red-500/20 shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">
                      Destructive Action
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      This will permanently delete this permission. Any roles using this permission
                      will lose the associated access.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200 font-mono">
                  {deletingPermission.name}
                </p>
                {deletingPermission.description && (
                  <p className="text-xs text-zinc-500 font-mono mt-1">
                    {deletingPermission.description}
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingPermission(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  ABORT
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingPermission.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white text-xs font-black uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-30"
                >
                  {deleteMutation.isPending ? 'PURGING...' : 'CONFIRM DELETION'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
