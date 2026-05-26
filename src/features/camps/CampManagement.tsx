import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Camp } from '../../types';
import { Plus, Edit2, MapPin, Activity, X, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';

export default function CampManagement() {
  const { user } = useAuthStore();
  const { currentCampId, setCurrentCamp } = useCampStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null);
  const [deletingCamp, setDeletingCamp] = useState<Camp | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'ABANDONED'>('ACTIVE');
  const [aiPrompt, setAiPrompt] = useState('');

  const { data: camps, isLoading } = useQuery<Camp[]>({
    queryKey: ['camps'],
    queryFn: async () => {
      const res = await apiClient.get('/camps');
      return res.data?.data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Camp>) => {
      const res = await apiClient.post('/camps', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Camp> }) => {
      const res = await apiClient.put(`/camps/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      setIsModalOpen(false);
      resetForm();
    },
  });

  const canDelete = hasPermission(user?.permissions, 'camps.delete');

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/camps/${id}`);
      return res.data;
    },
    onSuccess: (_data, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      if (currentCampId === deletedId) {
        setCurrentCamp(null);
      }
      setDeletingCamp(null);
      setDeleteError(null);
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ??
        (error as { message?: string })?.message ??
        'Unknown error';
      setDeleteError(msg);
    },
  });

  const resetForm = () => {
    setName('');
    setLocation('');
    setStatus('ACTIVE');
    setAiPrompt('');
    setEditingCamp(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (camp: Camp) => {
    setEditingCamp(camp);
    setName(camp.name);
    setLocation(camp.location || '');
    setStatus(camp.status);
    setAiPrompt(camp.ai_context_prompt || '');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload = {
      name,
      location,
      status,
      ai_context_prompt: aiPrompt,
    };

    if (editingCamp) {
      updateMutation.mutate({ id: editingCamp.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Refuge Management
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Multi-Refuge Setup & Command Guidelines
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        >
          <Plus size={20} />
          REGISTER NEW REFUGE
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-16 w-full rounded" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {camps?.map((camp) => (
            <motion.div
              key={camp.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised brutalist-border p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-brand-primary">
                      {camp.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mt-0.5">
                      <MapPin size={12} />
                      {camp.location || 'Undisclosed Sector'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                        camp.status === 'ACTIVE'
                          ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                          : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
                      )}
                    >
                      {camp.status}
                    </span>
                    <button
                      onClick={() => openEditModal(camp)}
                      aria-label={`Edit ${camp.name}`}
                      title={`Edit ${camp.name}`}
                      className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                    >
                      <Edit2 size={12} />
                    </button>
                    {canDelete && (
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeletingCamp(camp);
                        }}
                        aria-label={`Delete ${camp.name}`}
                        title={`Delete ${camp.name}`}
                        className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400 touch-target"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded border border-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-400">
                  <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
                    Stability AI Overwatch Focus Context
                  </p>
                  <p className="italic">
                    "
                    {camp.ai_context_prompt ||
                      'No override prompt defined. Standard quarantine measures active.'}
                    "
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-3">
                <span>
                  REFUGE SIGNATURE ID // GF-
                  {camp.id.toString().padStart(3, '0')}
                </span>
                <div className="flex items-center gap-3">
                  <Link
                    to={`/camps/${camp.id}`}
                    className="text-brand-primary hover:text-brand-primary/80 font-bold uppercase tracking-wider transition-colors"
                  >
                    VIEW DETAILS
                  </Link>
                  <span className="flex items-center gap-1">
                    <Activity size={10} className="text-emerald-500 animate-pulse" />
                    ONLINE
                  </span>
                </div>
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
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    COMMAND LOGISTIC CL-40
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingCamp ? 'Configure Refuge Parameters' : 'Register New Survival Center'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Setup defensive rules and allocation directives across Sector 04.
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close modal"
                  title="Close modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Refuge Title
                    </label>
                    <input
                      required
                      type="text"
                      aria-label="Refuge title"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sector-9 Outpost"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Geographical Location
                    </label>
                    <input
                      required
                      type="text"
                      aria-label="Geographical location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Colorado High Sierra"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Overwatch Status
                  </label>
                  <select
                    aria-label="Overwatch status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'ABANDONED')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE - SYSTEM OVERWATCH FUNCTIONAL</option>
                    <option value="ABANDONED">ABANDONED - OFF-GRID EMPTY SECTOR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    AI stability intelligence context prompt
                  </label>
                  <textarea
                    aria-label="AI stability intelligence context prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Focus directives (e.g. community survival, medical prioritize, strict resource rationing, military lockdown...)"
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                  <span className="text-[9px] font-mono text-zinc-600 block leading-tight">
                    This directly parameters the screening algorithm deciding the Admission intake
                    process.
                  </span>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
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
                      ? 'PROCESSING DICTIONARY...'
                      : 'CONFIRM SECTOR DISPATCH'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {deletingCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-raised brutalist-border rounded-xl p-4 sm:p-6 max-w-sm w-full space-y-5"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg shrink-0 bg-red-950/30 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="font-black uppercase tracking-tight text-sm">Delete Refuge</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Permanently delete <strong>{deletingCamp.name}</strong>? This action cannot be
                  undone. Deletion will fail if the camp still has associated people, inventory,
                  expeditions, or transfers.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 font-mono">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingCamp(null);
                  setDeleteError(null);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase disabled:opacity-40"
              >
                CANCEL
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingCamp.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-xs font-black uppercase rounded transition-colors disabled:opacity-40 bg-red-600 hover:bg-red-500 text-white"
              >
                {deleteMutation.isPending ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
