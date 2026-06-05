import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { User, Role } from '../../types';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  User as UserIcon,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';

const PAGE_SIZE = 10;
const API_LIST_PAGE_SIZE = 100;
const USERNAME_MAX_LENGTH = 60;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 255;

interface UsersResponse {
  data: User[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    totalPages: number;
  };
}

type RoleFilterValue = 'all' | number;
type StatusFilterValue = 'all' | 'active' | 'inactive';

type FieldErrors = {
  username?: string;
  password?: string;
  roleId?: string;
  campId?: string;
};

type UserFeedback = {
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

const normalizeUsersResponse = (responseData: unknown, page: number): UsersResponse => {
  if (Array.isArray(responseData)) {
    return {
      data: responseData as User[],
      pagination: {
        page,
        pageSize: API_LIST_PAGE_SIZE,
        total: responseData.length,
        hasNextPage: false,
        totalPages: Math.max(1, Math.ceil(responseData.length / PAGE_SIZE)),
      },
    };
  }

  const payload = responseData as Partial<UsersResponse> | undefined;
  const data = Array.isArray(payload?.data) ? payload.data : [];

  return {
    data,
    pagination: {
      page: payload?.pagination?.page ?? page,
      pageSize: payload?.pagination?.pageSize ?? API_LIST_PAGE_SIZE,
      total: payload?.pagination?.total ?? data.length,
      hasNextPage: payload?.pagination?.hasNextPage ?? false,
      totalPages:
        payload?.pagination?.totalPages ?? Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
    },
  };
};

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

function getUserActionErrorMessage(error: unknown, fallback: string) {
  const status = (error as ApiLikeError).response?.status;
  if (status === 403) return 'Your current role is not authorized to perform this action.';

  const validationDetails = extractValidationDetails(error);
  if (validationDetails) return validationDetails;

  return getApiErrorMessage(error, fallback);
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const currentCampId = useCampStore((s) => s.currentCampId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState<RoleFilterValue>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>('all');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<UserFeedback | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState<number | ''>('');
  const [campId, setCampId] = useState('');

  const canCreate = hasPermission(user?.permissions, 'users.create');
  const canUpdate = hasPermission(user?.permissions, 'users.update');
  const canDelete = hasPermission(user?.permissions, 'users.delete');

  const { data: usersResponse, isLoading } = useQuery<UsersResponse>({
    queryKey: ['users', 'list', API_LIST_PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/users', {
        params: { page: 1, pageSize: API_LIST_PAGE_SIZE },
      });
      return normalizeUsersResponse(res.data, 1);
    },
    enabled: hasPermission(user?.permissions, 'users.read'),
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ['roles', 'user-selector', API_LIST_PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/roles', {
        params: { page: 1, pageSize: API_LIST_PAGE_SIZE },
      });
      return res.data?.data ?? res.data;
    },
    enabled: hasPermission(user?.permissions, 'roles.read'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      username: string;
      password: string;
      role_id: number;
      camp_id: number;
    }) => {
      const res = await apiClient.post('/users', payload);
      return res.data;
    },
    onSuccess: (createdUser: User, payload) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      setRoleFilter(createdUser.role_id ?? payload.role_id);
      setPage(1);
      setFeedback({
        type: 'success',
        title: 'USER CREATED',
        message: `${createdUser.username} was registered successfully with the selected role.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'CREATE FAILED',
        message: getUserActionErrorMessage(error, 'The user account could not be created.'),
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
      payload: { username: string; role_id: number; camp_id: number };
    }) => {
      const res = await apiClient.put(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: (updatedUser: User) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
      setFeedback({
        type: 'success',
        title: 'USER UPDATED',
        message: `${updatedUser.username} was updated successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'UPDATE FAILED',
        message: getUserActionErrorMessage(error, 'The user account could not be updated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: (_data, deletedUserId) => {
      const username =
        deletingUser?.username ?? usersResponse?.data.find((u) => u.id === deletedUserId)?.username;
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
      setFeedback({
        type: 'success',
        title: 'USER DEACTIVATED',
        message: `${username ?? 'The user account'} was deactivated by the backend.`,
      });
    },
    onError: (error) => {
      setDeletingUser(null);
      setFeedback({
        type: 'error',
        title: 'DELETE FAILED',
        message: getUserActionErrorMessage(error, 'The user account could not be deactivated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: async (targetUser: User) => {
      const res = await apiClient.put(`/users/${targetUser.id}`, { is_active: true });
      return res.data as User;
    },
    onSuccess: (activatedUser) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFeedback({
        type: 'success',
        title: 'USER REACTIVATED',
        message: `${activatedUser.username} was reactivated successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'REACTIVATION FAILED',
        message: getUserActionErrorMessage(error, 'The user account could not be reactivated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRoleId('');
    setCampId('');
    setFieldErrors({});
  };

  const formatRole = (role?: string) =>
    typeof role === 'string' && role.length > 0 ? role.replace(/_/g, ' ') : 'unknown';

  const resolveUserRoleId = (userRecord: User): number | '' => {
    if (typeof userRecord.role_id === 'number') return userRecord.role_id;
    return roles?.find((role) => role.name === userRecord.role)?.id ?? '';
  };

  const getUserRoleId = (userRecord: User) => resolveUserRoleId(userRecord);

  const getUserRoleName = (userRecord: User) => {
    if (typeof userRecord.role_id === 'number') {
      const roleById = roles?.find((role) => role.id === userRecord.role_id);
      if (roleById) return roleById.name;
    }

    return userRecord.role;
  };

  const getUserRoleLabel = (userRecord: User) => {
    const roleName = getUserRoleName(userRecord);
    if (roleName) return formatRole(roleName);
    if (typeof userRecord.role_id === 'number') return `role #${userRecord.role_id}`;
    return 'unknown';
  };

  const getRoleFilterLabel = () => {
    if (roleFilter === 'all') return 'all roles';
    return formatRole(roles?.find((role) => role.id === roleFilter)?.name ?? `role #${roleFilter}`);
  };

  const getStatusFilterLabel = () => {
    if (statusFilter === 'all') return 'all statuses';
    return statusFilter === 'active' ? 'active users' : 'inactive users';
  };

  const validateForm = () => {
    const errors: FieldErrors = {};
    const trimmedUsername = username.trim();
    const trimmedCampId = campId.trim();

    if (!trimmedUsername) {
      errors.username = 'Username is required.';
    } else if (trimmedUsername.length > USERNAME_MAX_LENGTH) {
      errors.username = `Username cannot exceed ${USERNAME_MAX_LENGTH} characters.`;
    }

    if (!editingUser) {
      if (!password) {
        errors.password = 'Password is required.';
      } else if (password.length < PASSWORD_MIN_LENGTH) {
        errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
      } else if (password.length > PASSWORD_MAX_LENGTH) {
        errors.password = `Password cannot exceed ${PASSWORD_MAX_LENGTH} characters.`;
      }
    }

    if (roleId === '') {
      errors.roleId = 'Role is required.';
    }

    const numericCampId = Number(trimmedCampId);
    if (!trimmedCampId) {
      errors.campId = 'Camp ID is required.';
    } else if (!Number.isInteger(numericCampId) || numericCampId <= 0) {
      errors.campId = 'Camp ID must be a positive whole number.';
    }

    return errors;
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRoleId(roles?.[0]?.id ?? '');
    setCampId(currentCampId ? String(currentCampId) : '');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRoleId(resolveUserRoleId(user));
    setCampId(
      user.camp_id != null ? String(user.camp_id) : currentCampId ? String(currentCampId) : '',
    );
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFeedback({
        type: 'warning',
        title: 'CHECK USER FORMAT',
        message: 'Correct the highlighted fields before submitting the user account.',
        actionLabel: 'REVIEW',
      });
      return;
    }

    const trimmedUsername = username.trim();
    const numericCampId = Number(campId.trim());
    const numericRoleId = Number(roleId);

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        payload: {
          username: trimmedUsername,
          role_id: numericRoleId,
          camp_id: numericCampId,
        },
      });
    } else {
      createMutation.mutate({
        username: trimmedUsername,
        password,
        role_id: numericRoleId,
        camp_id: numericCampId,
      });
    }
  };

  const users = (usersResponse?.data ?? []).slice().sort((a, b) => b.id - a.id);
  const filteredUsers = users.filter((userRecord) => {
    const isActive = userRecord.is_active !== false;
    const matchesRole = roleFilter === 'all' || getUserRoleId(userRecord) === roleFilter;
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' ? isActive : userRecord.is_active === false);

    return matchesRole && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Users
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Manage system users and role assignments
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW USER
          </button>
        )}
      </div>

      <div className="grid gap-3 rounded-xl border border-zinc-900 bg-surface-raised/70 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="flex flex-1 flex-col gap-1">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <Filter size={13} />
            Role filter
          </span>
          <select
            value={roleFilter}
            onChange={(e) => {
              const value = e.target.value;
              setRoleFilter(value === 'all' ? 'all' : Number(value));
              setPage(1);
            }}
            aria-label="Filter users by role"
            className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300 outline-none transition-colors focus:border-brand-primary"
          >
            <option value="all" className="bg-zinc-950">
              All roles
            </option>
            {roles?.map((role) => (
              <option key={role.id} value={role.id} className="bg-zinc-950">
                {formatRole(role.name)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <Filter size={13} />
            Status filter
          </span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilterValue);
              setPage(1);
            }}
            aria-label="Filter users by active status"
            className="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300 outline-none transition-colors focus:border-brand-primary"
          >
            <option value="all" className="bg-zinc-950">
              All statuses
            </option>
            <option value="active" className="bg-zinc-950">
              Active users
            </option>
            <option value="inactive" className="bg-zinc-950">
              Inactive users
            </option>
          </select>
        </label>
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-zinc-600">
          Showing {filteredUsers.length} of {usersResponse?.pagination.total ?? users.length}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-5 bg-surface-raised/40 brutalist-border rounded-xl space-y-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/5" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {users.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Shield size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No users found</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Create the first system user to begin managing access
              </p>
            </div>
          )}
          {users.length > 0 && filteredUsers.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Filter size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No users match filters</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                No accounts match {getRoleFilterLabel()} and {getStatusFilterLabel()}
              </p>
            </div>
          )}
          {paginatedUsers.map((user) => {
            const isActive = user.is_active !== false;

            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-raised brutalist-border p-5 rounded-xl flex items-center justify-between hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 shrink-0">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-white">
                      {user.username}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-zinc-950/40 text-zinc-400 border-zinc-800">
                        {getUserRoleLabel(user)}
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isActive
                            ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                            : 'bg-red-950/20 text-red-500 border-red-500/30'
                        }`}
                      >
                        {isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                      {user.camp_id != null && (
                        <span className="text-[10px] font-mono text-zinc-600">
                          Camp #{user.camp_id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {canUpdate && (
                    <button
                      onClick={() => openEditModal(user)}
                      aria-label={`Edit ${user.username}`}
                      title={`Edit ${user.username}`}
                      className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                  {canUpdate && !isActive && (
                    <button
                      onClick={() => activateMutation.mutate(user)}
                      disabled={activateMutation.isPending}
                      aria-label={`Reactivate ${user.username}`}
                      title={`Reactivate ${user.username}`}
                      className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 hover:text-emerald-400 rounded transition-colors text-zinc-400 disabled:opacity-40 touch-target"
                    >
                      <RotateCcw size={12} />
                    </button>
                  )}
                  {canDelete && isActive && (
                    <button
                      onClick={() => setDeletingUser(user)}
                      aria-label={`Delete ${user.username}`}
                      title={`Delete ${user.username}`}
                      className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400 touch-target"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        showEdgeButtons
      />

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
                    PERSONNEL SECURITY PS-01
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingUser ? 'Edit User' : 'Register New User'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {editingUser
                      ? 'Modify user role and profile settings.'
                      : 'Create a new system user with role-based access.'}
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

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Format requirements
                  </p>
                  <p className="text-[10px] font-mono leading-relaxed text-zinc-500">
                    Username is required and max 60 characters. Password is required on creation, 8
                    to 255 characters. Role and Camp ID are required.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    aria-label="Username"
                    aria-invalid={Boolean(fieldErrors.username)}
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (fieldErrors.username) {
                        setFieldErrors((prev) => ({ ...prev, username: undefined }));
                      }
                    }}
                    placeholder="e.g. jdoe"
                    className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                      fieldErrors.username
                        ? 'border-red-500/60 focus:border-red-400'
                        : 'border-zinc-800 focus:border-brand-primary'
                    }`}
                  />
                  <p
                    className={`text-[10px] font-mono ${
                      fieldErrors.username ? 'text-red-400' : 'text-zinc-600'
                    }`}
                  >
                    {fieldErrors.username ??
                      `Required. ${username.length}/${USERNAME_MAX_LENGTH} characters.`}
                  </p>
                </div>

                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="password"
                      aria-label="Password"
                      aria-invalid={Boolean(fieldErrors.password)}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({ ...prev, password: undefined }));
                        }
                      }}
                      placeholder="Minimum 8 characters"
                      className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                        fieldErrors.password
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary'
                      }`}
                    />
                    <p
                      className={`text-[10px] font-mono ${
                        fieldErrors.password ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {fieldErrors.password ??
                        `Required on creation. ${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} characters.`}
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    aria-label="Role"
                    aria-invalid={Boolean(fieldErrors.roleId)}
                    value={roleId}
                    onChange={(e) => {
                      setRoleId(Number(e.target.value));
                      if (fieldErrors.roleId) {
                        setFieldErrors((prev) => ({ ...prev, roleId: undefined }));
                      }
                    }}
                    className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none ${
                      fieldErrors.roleId
                        ? 'border-red-500/60 focus:border-red-400'
                        : 'border-zinc-800 focus:border-brand-primary'
                    }`}
                  >
                    <option value="" disabled className="bg-zinc-950">
                      Select role
                    </option>
                    {!roles ? (
                      <option value="" disabled className="bg-zinc-950">
                        Loading roles...
                      </option>
                    ) : roles.length === 0 ? (
                      <option value="" disabled className="bg-zinc-950">
                        No roles available
                      </option>
                    ) : (
                      roles.map((r) => (
                        <option key={r.id} value={r.id} className="bg-zinc-950">
                          {r.name.replace(/_/g, ' ')}
                        </option>
                      ))
                    )}
                  </select>
                  <p
                    className={`text-[10px] font-mono ${
                      fieldErrors.roleId ? 'text-red-400' : 'text-zinc-600'
                    }`}
                  >
                    {fieldErrors.roleId ?? 'Required. Role options are loaded from Roles.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Camp ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    aria-label="Camp ID"
                    aria-invalid={Boolean(fieldErrors.campId)}
                    value={campId}
                    onChange={(e) => {
                      setCampId(e.target.value);
                      if (fieldErrors.campId) {
                        setFieldErrors((prev) => ({ ...prev, campId: undefined }));
                      }
                    }}
                    placeholder="e.g. 1"
                    className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                      fieldErrors.campId
                        ? 'border-red-500/60 focus:border-red-400'
                        : 'border-zinc-800 focus:border-brand-primary'
                    }`}
                  />
                  <p
                    className={`text-[10px] font-mono ${
                      fieldErrors.campId ? 'text-red-400' : 'text-zinc-600'
                    }`}
                  >
                    {fieldErrors.campId ?? 'Required. Must be a positive whole number.'}
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
                      : editingUser
                        ? 'UPDATE RECORD'
                        : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingUser && (
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
                      Deactivate Account
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      This will deactivate the user account and terminate active sessions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">{deletingUser.username}</p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Role: {getUserRoleLabel(deletingUser)} &middot; Camp:{' '}
                  {deletingUser.camp_id ?? 'None'}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  ABORT
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingUser.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white text-xs font-black uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-30"
                >
                  {deleteMutation.isPending ? 'DEACTIVATING...' : 'CONFIRM DEACTIVATION'}
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
          eyebrow="Personnel Security"
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
