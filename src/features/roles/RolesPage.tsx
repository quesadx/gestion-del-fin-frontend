import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Role, Permission } from '../../types';
import { Shield, Plus, Edit2, Trash2, X, AlertCircle, Key, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 10;
const PERMISSIONS_PAGE_SIZE = 100;

const getPermissionGroup = (permissionName: string) => permissionName.split('.')[0] || 'other';

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [page, setPage] = useState(1);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [permissionSearch, setPermissionSearch] = useState('');

  const canCreate = hasPermission(user?.permissions, 'roles.create');
  const canUpdate = hasPermission(user?.permissions, 'roles.update');
  const canDelete = hasPermission(user?.permissions, 'roles.delete');

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get('/roles');
      return res.data?.data ?? res.data;
    },
    enabled: hasPermission(user?.permissions, 'roles.read'),
  });

  const { data: permissions, isLoading: isLoadingPermissions } = useQuery<Permission[]>({
    queryKey: ['permissions', 'role-selector', PERMISSIONS_PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/permissions', {
        params: { page: 1, pageSize: PERMISSIONS_PAGE_SIZE },
      });
      const body = res.data;
      return body?.data ?? (Array.isArray(body) ? body : []);
    },
    enabled: hasPermission(user?.permissions, 'permissions.read'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      description?: string;
      permission_ids?: number[];
    }) => {
      const res = await apiClient.post('/roles', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name?: string; description?: string; permission_ids?: number[] };
    }) => {
      const res = await apiClient.put(`/roles/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/roles/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeletingRole(null);
    },
  });

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const toggleVisiblePermissions = (checked: boolean) => {
    const visibleIds = filteredPermissions.map((permission) => permission.id);
    setSelectedPermissionIds((prev) => {
      if (checked) return Array.from(new Set([...prev, ...visibleIds]));
      const visibleIdSet = new Set(visibleIds);
      return prev.filter((id) => !visibleIdSet.has(id));
    });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelectedPermissionIds([]);
    setPermissionSearch('');
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelectedPermissionIds([]);
    setPermissionSearch('');
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setSelectedPermissionIds(role.permissions?.map((p) => p.id) ?? []);
    setPermissionSearch('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        payload: {
          name,
          description: description || undefined,
          permission_ids: selectedPermissionIds,
        },
      });
    } else {
      createMutation.mutate({
        name,
        description: description || undefined,
        permission_ids: selectedPermissionIds,
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil((roles?.length ?? 0) / PAGE_SIZE));
  const paginatedRoles = (roles ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allPermissions = permissions ?? [];
  const permissionSearchTerm = permissionSearch.trim().toLowerCase();
  const filteredPermissions = permissionSearchTerm
    ? allPermissions.filter((permission) => {
        const searchableText = `${permission.name} ${permission.description ?? ''}`.toLowerCase();
        return searchableText.includes(permissionSearchTerm);
      })
    : allPermissions;
  const permissionGroups = new Map<string, Permission[]>();

  filteredPermissions.forEach((permission) => {
    const group = getPermissionGroup(permission.name);
    const permissionsInGroup = permissionGroups.get(group) ?? [];
    permissionsInGroup.push(permission);
    permissionGroups.set(group, permissionsInGroup);
  });

  const groupedPermissions = Array.from(permissionGroups.entries()).map(
    ([group, groupPermissions]) => ({
      group,
      permissions: groupPermissions,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Roles
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Manage role definitions and permission assignments
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW ROLE
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-5 bg-surface-raised/40 brutalist-border rounded-xl space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {roles?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Shield size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No roles defined</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Create the first role to begin configuring access control
              </p>
            </div>
          )}
          {paginatedRoles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised brutalist-border p-5 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 shrink-0">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-white">
                    {role.name.replace(/_/g, ' ')}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {role.is_system && (
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-amber-950/20 text-amber-500 border-amber-500/30">
                        SYSTEM
                      </span>
                    )}
                    <span className="text-xs font-mono text-zinc-500">
                      {role.permissions?.length ?? 0} permission
                      {role.permissions?.length !== 1 ? 's' : ''}
                    </span>
                    {role.description && (
                      <span className="text-xs font-mono text-zinc-600">— {role.description}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {canUpdate && (
                  <button
                    onClick={() => openEditModal(role)}
                    aria-label={`Edit ${role.name}`}
                    title={`Edit ${role.name}`}
                    className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setDeletingRole(role)}
                    aria-label={`Delete ${role.name}`}
                    title={`Delete ${role.name}`}
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
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-2xl w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    ACCESS CONTROL SEC-09
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingRole ? 'Edit Role' : 'Propose New Role'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {editingRole
                      ? 'Modify role name, description, and permission bindings.'
                      : 'Justify and propose a new role. The description serves as the formal justification for why this role is needed.'}
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
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    aria-label="Role name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. camp_operator"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Justification / Description
                  </label>
                  <textarea
                    aria-label="Role justification / description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explain why this role is needed and what it enables..."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <Key size={12} />
                    Permissions
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <Search
                        size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
                      />
                      <input
                        type="search"
                        aria-label="Search permissions"
                        value={permissionSearch}
                        onChange={(e) => setPermissionSearch(e.target.value)}
                        placeholder="Filter by permission or description"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded pl-8 pr-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:flex">
                      <button
                        type="button"
                        onClick={() => toggleVisiblePermissions(true)}
                        disabled={filteredPermissions.length === 0}
                        className="px-3 py-2 text-[10px] font-bold uppercase border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Select visible
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleVisiblePermissions(false)}
                        disabled={filteredPermissions.length === 0}
                        className="px-3 py-2 text-[10px] font-bold uppercase border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Clear visible
                      </button>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto bg-zinc-950/60 border border-zinc-900 rounded p-3 space-y-3">
                    {isLoadingPermissions && (
                      <p className="text-xs font-mono text-zinc-600 p-2">Loading permissions...</p>
                    )}
                    {!isLoadingPermissions && allPermissions.length === 0 && (
                      <p className="text-xs font-mono text-zinc-600 p-2">
                        No permissions registered yet. Create permissions first.
                      </p>
                    )}
                    {!isLoadingPermissions &&
                      allPermissions.length > 0 &&
                      filteredPermissions.length === 0 && (
                        <p className="text-xs font-mono text-zinc-600 p-2">
                          No permissions match this filter.
                        </p>
                      )}
                    {groupedPermissions.map(({ group, permissions: groupPermissions }) => {
                      const selectedInGroup = groupPermissions.filter((permission) =>
                        selectedPermissionIds.includes(permission.id),
                      ).length;

                      return (
                        <div key={group} className="space-y-1">
                          <div className="flex items-center justify-between px-1 py-1 border-b border-zinc-900">
                            <span className="text-[10px] font-black uppercase tracking-wider text-brand-primary">
                              {group}
                            </span>
                            <span className="text-[9px] font-mono text-zinc-600">
                              {selectedInGroup}/{groupPermissions.length} selected
                            </span>
                          </div>

                          {groupPermissions.map((perm) => (
                            <label
                              key={perm.id}
                              className="flex items-start gap-2 p-1.5 hover:bg-zinc-900/50 rounded cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissionIds.includes(perm.id)}
                                onChange={() => togglePermission(perm.id)}
                                className="accent-brand-primary shrink-0 mt-0.5"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-mono font-bold text-zinc-300">
                                  {perm.name}
                                </span>
                                {perm.description && (
                                  <span className="block text-[10px] font-mono text-zinc-600">
                                    {perm.description}
                                  </span>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600">
                    {selectedPermissionIds.length} of {allPermissions.length} permission
                    {allPermissions.length !== 1 ? 's' : ''} selected
                  </p>
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
                      : editingRole
                        ? 'UPDATE RECORD'
                        : 'PROPOSE ROLE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingRole && (
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
                      This will permanently delete this role. Users assigned to this role will lose
                      their permissions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">
                  {deletingRole.name.replace(/_/g, ' ')}
                </p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {deletingRole.permissions?.length ?? 0} permission
                  {deletingRole.permissions?.length !== 1 ? 's' : ''} assigned
                  {deletingRole.description && (
                    <>
                      <span className="text-zinc-700"> &middot; </span>
                      {deletingRole.description}
                    </>
                  )}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingRole(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  ABORT
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingRole.id)}
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
