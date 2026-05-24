import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { User } from '../../types';
import { Shield, Plus, Edit2, Trash2, X, AlertCircle, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';

const KNOWN_ROLES = ['system_admin', 'resource_manager', 'travel_coordinator', 'survivor'];

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('survivor');
  const [campId, setCampId] = useState('');

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await apiClient.get('/users');
      return res.data?.data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      username: string;
      password: string;
      role: string;
      camp_id?: number | null;
    }) => {
      const res = await apiClient.post('/users', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { username: string; role: string; camp_id?: number | null };
    }) => {
      const res = await apiClient.put(`/users/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingUser(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('survivor');
    setCampId('');
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('survivor');
    setCampId('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword('');
    setRole(user.role);
    setCampId(user.camp_id != null ? String(user.camp_id) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;

    if (editingUser) {
      updateMutation.mutate({
        id: editingUser.id,
        payload: {
          username,
          role,
          camp_id: campId ? Number(campId) : null,
        },
      });
    } else {
      if (!password) return;
      createMutation.mutate({
        username,
        password,
        role,
        camp_id: campId ? Number(campId) : null,
      });
    }
  };

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
        <button
          onClick={openCreateModal}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <Plus size={20} />
          NEW USER
        </button>
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
          {users?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Shield size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No users found</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Create the first system user to begin managing access
              </p>
            </div>
          )}
          {users?.map((user) => (
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
                      {user.role.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        user.is_active !== false
                          ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                          : 'bg-red-950/20 text-red-500 border-red-500/30'
                      }`}
                    >
                      {user.is_active !== false ? 'ACTIVE' : 'INACTIVE'}
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
                <button
                  onClick={() => openEditModal(user)}
                  className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400"
                >
                  <Edit2 size={12} />
                </button>
                <button
                  onClick={() => setDeletingUser(user)}
                  className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
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
                  className="p-1 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Username</label>
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. jdoe"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Password
                    </label>
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Role</label>
                  <select
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary"
                  >
                    {KNOWN_ROLES.map((r) => (
                      <option key={r} value={r} className="bg-zinc-950">
                        {r.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Camp ID <span className="text-zinc-700 font-normal">(optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={campId}
                    onChange={(e) => setCampId(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
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
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-md w-full space-y-6"
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
                      This will permanently delete this user account from the system.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">{deletingUser.username}</p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Role: {deletingUser.role.replace(/_/g, ' ')} &middot; Camp:{' '}
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
