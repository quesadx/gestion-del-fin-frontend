import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useCan, PERM } from '../../lib/permissions';
import { Resource } from '../../types';
import { Package, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [dailyRation, setDailyRation] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [autoDaily, setAutoDaily] = useState(false);
  const canCreate = useCan(PERM.RESOURCES_CREATE);
  const canUpdate = useCan(PERM.RESOURCES_UPDATE);
  const canDelete = useCan(PERM.RESOURCES_DELETE);

  const { data: resources, isLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return res.data?.data ?? res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: {
      name: string;
      unit: string;
      daily_ration: number;
      minimum_stock: number;
      auto_daily: boolean;
    }) => {
      const res = await apiClient.post('/resources', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: {
        name: string;
        unit: string;
        daily_ration: number;
        minimum_stock: number;
        auto_daily: boolean;
      };
    }) => {
      const res = await apiClient.put(`/resources/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/resources/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      setDeletingResource(null);
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
    setName('');
    setUnit('');
    setDailyRation('');
    setMinimumStock('');
    setAutoDaily(false);
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setName('');
    setUnit('');
    setDailyRation('');
    setMinimumStock('');
    setAutoDaily(false);
    setIsModalOpen(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setName(resource.name);
    setUnit(resource.unit);
    setDailyRation(String(resource.daily_ration));
    setMinimumStock(String(resource.minimum_stock));
    setAutoDaily(resource.auto_daily);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) return;

    const payload = {
      name,
      unit,
      daily_ration: Number(dailyRation) || 0,
      minimum_stock: Number(minimumStock) || 0,
      auto_daily: autoDaily,
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Resource Types
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Define resource categories, units, and ration parameters
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW RESOURCE TYPE
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {resources?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Package size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">
                No resource types defined
              </p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Register the first resource type to begin cataloging supplies
              </p>
            </div>
          )}
          {resources?.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised brutalist-border p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800">
                    <Package size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        onClick={() => openEditModal(resource)}
                        className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeletingResource(resource)}
                        className="p-1.5 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {resource.name}
                  </h3>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">Unit: {resource.unit}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950/60 rounded border border-zinc-900">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
                      Daily Ration
                    </p>
                    <p className="text-sm font-mono font-bold text-zinc-200">
                      {resource.daily_ration} {resource.unit}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950/60 rounded border border-zinc-900">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
                      Min. Stock
                    </p>
                    <p className="text-sm font-mono font-bold text-zinc-200">
                      {resource.minimum_stock} {resource.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                      resource.auto_daily
                        ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                        : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
                    )}
                  >
                    {resource.auto_daily ? 'AUTO DAILY' : 'MANUAL RATION'}
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
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    RESOURCE REGISTRY RR-07
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingResource ? 'Edit Resource Parameters' : 'Register New Resource Type'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Categorize supply types and set baseline consumption metrics across all refuges.
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Resource Name
                    </label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Canned Beans"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Unit of Measure
                    </label>
                    <input
                      required
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. kg, cans, liters"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Daily Ration per Person
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={dailyRation}
                      onChange={(e) => setDailyRation(e.target.value)}
                      placeholder="e.g. 0.5"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Minimum Stock Level
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="any"
                      value={minimumStock}
                      onChange={(e) => setMinimumStock(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Ration Mode
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-zinc-950/60 border border-zinc-900 rounded">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDaily}
                        onChange={(e) => setAutoDaily(e.target.checked)}
                        className="accent-brand-primary"
                      />
                      <span className="text-xs text-zinc-300 font-mono font-bold">
                        AUTO DAILY — automatically deduct daily ration each cycle
                      </span>
                    </label>
                  </div>
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
                      : editingResource
                        ? 'UPDATE REGISTRY'
                        : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingResource && (
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
                      This will permanently delete this resource type from all refuge registries.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">{deletingResource.name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Unit: {deletingResource.unit} &middot; Daily ration:{' '}
                  {deletingResource.daily_ration} &middot; Min stock:{' '}
                  {deletingResource.minimum_stock}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingResource(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  ABORT
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingResource.id)}
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
