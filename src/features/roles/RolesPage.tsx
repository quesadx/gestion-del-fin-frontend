import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Role, Permission } from '../../types';
import { Shield, Plus, Edit2, Trash2, X, AlertCircle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';

const PAGE_SIZE = 10;
const API_LIST_PAGE_SIZE = 100;
const ROLE_NAME_PATTERN = /^[a-z_]+$/;

type FieldErrors = {
  name?: string;
  description?: string;
};

type RoleFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

type ApiLikeError = {
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: unknown;
        details?: unknown;
      };
      message?: unknown;
    };
  };
};

function formatRoleName(value: string) {
  return value.replace(/_/g, ' ');
}

function validateRoleFields(roleName: string, roleDescription: string): FieldErrors {
  const errors: FieldErrors = {};
  const trimmedName = roleName.trim();

  if (!trimmedName) {
    errors.name = 'Role name is required.';
  } else if (trimmedName.length > 60) {
    errors.name = 'Role name cannot exceed 60 characters.';
  } else if (!ROLE_NAME_PATTERN.test(trimmedName)) {
    errors.name = 'Use lowercase letters and underscores only.';
  }

  if (roleDescription.length > 255) {
    errors.description = 'Description cannot exceed 255 characters.';
  }

  return errors;
}

function extractValidationDetails(error: unknown) {
  const details = (error as ApiLikeError).response?.data?.error?.details;
  if (!Array.isArray(details)) return '';

  return details
    .map((detail) => {
      if (detail && typeof detail === 'object' && 'message' in detail) {
        const message = (detail as { message?: unknown }).message;
        return typeof message === 'string' ? message : '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

function getRoleActionErrorMessage(error: unknown, fallback: string) {
  const status = (error as ApiLikeError).response?.status;
  if (status === 403) return 'Your current role is not authorized to perform this action.';

  const validationDetails = extractValidationDetails(error);
  if (validationDetails) return validationDetails;

  return getApiErrorMessage(error, fallback);
}

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);
  const [page, setPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<RoleFeedback | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const canCreate = hasPermission(user?.permissions, 'roles.create');
  const canUpdate = hasPermission(user?.permissions, 'roles.update');
  const canDelete = hasPermission(user?.permissions, 'roles.delete');

  const { data: roles, isLoading } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await apiClient.get(`/roles?pageSize=${API_LIST_PAGE_SIZE}`);
      return res.data?.data ?? res.data;
    },
    enabled: hasPermission(user?.permissions, 'roles.read'),
  });

  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await apiClient.get(`/permissions?pageSize=${API_LIST_PAGE_SIZE}`);
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
    onSuccess: (createdRole: Role) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
      setFeedback({
        type: 'success',
        title: 'ROLE CREATED',
        message: `${formatRoleName(createdRole.name)} was created successfully and is now available for user assignment.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'CREATE FAILED',
        message: getRoleActionErrorMessage(error, 'The role could not be created.'),
        actionLabel: 'REVIEW',
      });
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
    onSuccess: (updatedRole: Role) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      closeModal();
      setFeedback({
        type: 'success',
        title: 'ROLE UPDATED',
        message: `${formatRoleName(updatedRole.name)} was updated successfully with the selected permission bindings.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'UPDATE FAILED',
        message: getRoleActionErrorMessage(error, 'The role could not be updated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/roles/${id}`);
      return res.data;
    },
    onSuccess: (_data, deletedRoleId) => {
      const roleName = roles?.find((role) => role.id === deletedRoleId)?.name ?? 'role';
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeletingRole(null);
      setFeedback({
        type: 'success',
        title: 'ROLE DELETED',
        message: `${formatRoleName(roleName)} was removed successfully.`,
      });
    },
    onError: (error) => {
      setDeletingRole(null);
      setFeedback({
        type: 'error',
        title: 'DELETE FAILED',
        message: getRoleActionErrorMessage(error, 'The role could not be deleted.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const togglePermission = (id: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelectedPermissionIds([]);
    setFieldErrors({});
  };

  const openCreateModal = () => {
    setEditingRole(null);
    setName('');
    setDescription('');
    setSelectedPermissionIds([]);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || '');
    setSelectedPermissionIds(role.permissions?.map((p) => p.id) ?? []);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateRoleFields(name, description);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFeedback({
        type: 'warning',
        title: 'CHECK ROLE FORMAT',
        message:
          'Correct the highlighted fields before submitting. Role names must use lowercase letters and underscores only.',
        actionLabel: 'REVIEW',
      });
      return;
    }

    const trimmedName = name.trim();
    const trimmedDescription = description.trim();

    if (editingRole) {
      updateMutation.mutate({
        id: editingRole.id,
        payload: {
          name: trimmedName,
          description: trimmedDescription,
          permission_ids: selectedPermissionIds,
        },
      });
    } else {
      createMutation.mutate({
        name: trimmedName,
        description: trimmedDescription || undefined,
        permission_ids: selectedPermissionIds,
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil((roles?.length ?? 0) / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRoles = (roles ?? []).slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const descriptionIsTooLong = description.length > 255;

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
                    {formatRoleName(role.name)}
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

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

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
                <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Format requirements
                  </p>
                  <p className="text-[10px] font-mono leading-relaxed text-zinc-500">
                    Role name is required, max 60 characters, lowercase letters and underscores
                    only. Description is optional and max 255 characters.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    aria-label="Role name"
                    aria-invalid={Boolean(fieldErrors.name)}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="e.g. camp_operator"
                    className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none font-mono ${
                      fieldErrors.name
                        ? 'border-red-500/60 focus:border-red-400'
                        : 'border-zinc-800 focus:border-brand-primary'
                    }`}
                  />
                  <p
                    className={`text-[10px] font-mono ${
                      fieldErrors.name ? 'text-red-400' : 'text-zinc-600'
                    }`}
                  >
                    {fieldErrors.name ?? 'Required. Use lowercase letters and underscores only.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Justification / Description
                  </label>
                  <textarea
                    aria-label="Role justification / description"
                    aria-invalid={Boolean(fieldErrors.description)}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (fieldErrors.description) {
                        setFieldErrors((prev) => ({ ...prev, description: undefined }));
                      }
                    }}
                    placeholder="Explain why this role is needed and what it enables..."
                    rows={3}
                    className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none resize-none font-mono ${
                      fieldErrors.description
                        ? 'border-red-500/60 focus:border-red-400'
                        : 'border-zinc-800 focus:border-brand-primary'
                    }`}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p
                      className={`text-[10px] font-mono ${
                        fieldErrors.description ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {fieldErrors.description ?? 'Optional. Max 255 characters.'}
                    </p>
                    <p
                      className={`text-[10px] font-mono ${
                        descriptionIsTooLong ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {description.length}/255
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-2">
                    <Key size={12} />
                    Permissions
                  </label>
                  <div className="max-h-48 overflow-y-auto bg-zinc-950/60 border border-zinc-900 rounded p-3 space-y-1">
                    {permissions?.length === 0 && (
                      <p className="text-xs font-mono text-zinc-600 p-2">
                        No permissions registered yet. Create permissions first.
                      </p>
                    )}
                    {permissions?.map((perm) => (
                      <label
                        key={perm.id}
                        className="flex items-center gap-2 p-1.5 hover:bg-zinc-900/50 rounded cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPermissionIds.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          className="accent-brand-primary shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-mono font-bold text-zinc-300">
                            {perm.name}
                          </span>
                          {perm.description && (
                            <span className="text-[10px] font-mono text-zinc-600 ml-2">
                              — {perm.description}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-zinc-600">
                    {selectedPermissionIds.length} permission
                    {selectedPermissionIds.length !== 1 ? 's' : ''} selected
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
                      their permissions. The backend will reject this action while users remain
                      assigned to the role.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">
                  {formatRoleName(deletingRole.name)}
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

      {feedback && (
        <ActionFeedbackDialog
          isOpen={true}
          type={feedback.type}
          eyebrow="Access Control"
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
