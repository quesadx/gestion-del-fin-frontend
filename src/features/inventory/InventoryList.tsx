import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useCampStore } from '../../store';
import { InventorySnapshot, Resource } from '../../types';
import {
  Package,
  AlertTriangle,
  ArrowDownUp,
  Info,
  History,
  X,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 12;

export default function InventoryList() {
  const { currentCampId } = useCampStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  // Form states for manual adjustment
  const [selectedResourceId, setSelectedResourceId] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'MANUAL_IN' | 'MANUAL_OUT'>('MANUAL_IN');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustDescription, setAdjustDescription] = useState<string>('');

  const { data: inventory, isLoading } = useQuery<InventorySnapshot[]>({
    queryKey: ['inventory', currentCampId],
    queryFn: async () => {
      const [invRes, resRes] = await Promise.all([
        apiClient.get(`/inventory/${currentCampId}`),
        apiClient.get('/resources'),
      ]);
      const items = (invRes.data?.data ?? invRes.data ?? []) as Array<{
        resource_type_id: number;
        quantity?: number;
      }>;
      const resourceTypes = (resRes.data?.data ?? resRes.data ?? []) as Resource[];
      return items.map((item) => {
        const rt = resourceTypes.find((r) => r.id === item.resource_type_id);
        const qty = Math.floor(Number(item.quantity ?? 0));
        const minStock = Math.floor(Number(rt?.minimum_stock ?? 0));
        return {
          resource_id: item.resource_type_id,
          resource_name: rt?.name ?? `Resource #${item.resource_type_id}`,
          unit: rt?.unit ?? '',
          quantity: qty,
          minimum_stock: minStock,
          daily_ration: Math.floor(Number(rt?.daily_ration ?? 0)),
          daily_usage: 0,
          projection_days: null,
          status: qty < minStock ? (qty < minStock / 2 ? 'CRITICAL' : 'LOW') : 'OK',
        } satisfies InventorySnapshot;
      }) as InventorySnapshot[];
    },
    enabled: !!currentCampId,
  });

  const totalPages = Math.max(1, Math.ceil((inventory?.length ?? 0) / PAGE_SIZE));
  const paginatedInventory = (inventory ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const adjustMutation = useMutation({
    mutationFn: async (payload: {
      camp_id: number;
      resource_type_id: number;
      type: 'MANUAL_IN' | 'MANUAL_OUT';
      quantity: number;
      description: string;
    }) => {
      const res = await apiClient.post('/inventory/adjustment', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', currentCampId] });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-metrics', currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ['resource-metrics', currentCampId],
      });
      setIsAdjustOpen(false);
      setAdjustQuantity('');
      setAdjustDescription('');
      setAdjustError(null);
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error)?.message ||
        'Adjustment failed';
      setAdjustError(msg);
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Math.floor(Number(adjustQuantity));
    if (!currentCampId || !selectedResourceId || isNaN(qty) || qty <= 0) return;

    adjustMutation.mutate({
      camp_id: currentCampId,
      resource_type_id: selectedResourceId,
      type: adjustType,
      quantity: qty,
      description:
        adjustDescription ||
        `Manual ${adjustType === 'MANUAL_IN' ? 'Ingress' : 'Egress'} of resources`,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-secondary">
            Storage Logs
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Critical inventory & rationing alerts
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/inventory/audit')}
            className="brutalist-border hover:bg-zinc-900 text-zinc-300 font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
          >
            <History size={18} />
            VIEW AUDIT TRAIL
          </button>
          <button
            onClick={() => {
              if (inventory && inventory.length > 0) {
                setSelectedResourceId(inventory[0].resource_id);
              }
              setIsAdjustOpen(true);
            }}
            className="bg-brand-secondary hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
          >
            <ArrowDownUp size={18} />
            MANUAL ADJUST
          </button>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-6 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-2 w-8" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
                <div className="pt-2 flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            ))
          : paginatedInventory.map((item) => (
              <motion.div
                key={item.resource_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 bg-surface-raised brutalist-border rounded-xl space-y-6 relative overflow-hidden group transition-all hover:bg-zinc-900/80 ${
                  item.status === 'CRITICAL'
                    ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : item.status === 'LOW'
                      ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'border-zinc-800'
                }`}
              >
                {/* Status Indicator */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rotate-45 opacity-10 ${
                    item.status === 'CRITICAL'
                      ? 'bg-red-500'
                      : item.status === 'LOW'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />

                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <Package size={24} />
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border flex items-center gap-1',
                      item.status === 'CRITICAL'
                        ? 'bg-red-950/20 text-red-500 border-red-500/30'
                        : item.status === 'LOW'
                          ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                          : 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30',
                    )}
                  >
                    {item.status === 'CRITICAL' && <AlertTriangle size={10} />}
                    {item.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    {item.resource_name}
                    <button className="text-zinc-600 hover:text-zinc-400">
                      <Info size={14} />
                    </button>
                  </h3>
                  <p className="text-zinc-500 font-mono text-xs uppercase">Unit: {item.unit}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">
                      In Stock
                    </span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        item.status === 'CRITICAL'
                          ? 'text-red-500'
                          : item.status === 'LOW'
                            ? 'text-amber-500'
                            : 'text-zinc-100'
                      }`}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((item.quantity / (item.minimum_stock * 2)) * 100, 100)}%`,
                      }}
                      className={`h-full ${
                        item.status === 'CRITICAL'
                          ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                          : item.status === 'LOW'
                            ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase">
                    <span>0</span>
                    <span className="text-zinc-400 font-bold">
                      Reserve Floor: {item.minimum_stock}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-4">
                  <div className="flex-1 p-2 bg-zinc-950 border border-zinc-900 rounded text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Daily Ration</p>
                    <p className="text-xs font-mono font-bold">
                      {item.daily_ration} {item.unit}/p
                    </p>
                  </div>
                  <div className="flex-1 p-2 bg-zinc-950 border border-zinc-900 rounded text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Projection</p>
                    <p
                      className={cn(
                        'text-xs font-mono font-bold text-nowrap',
                        (item.projection_days || 0) < 5
                          ? 'text-red-500'
                          : (item.projection_days || 0) < 10
                            ? 'text-amber-500'
                            : 'text-emerald-500',
                      )}
                    >
                      {item.projection_days !== null ? `${item.projection_days} Days` : 'N/A'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

        <div className="pt-6 flex justify-center">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      <AnimatePresence>
        {/* Manual Adjust Modal */}
        {isAdjustOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest leading-none mb-1">
                    DISPENSARY INTERFACE CR-08
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Manual Stock Adjustment
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Override stockpile logs due to field discoveries or unplanned rationing.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAdjustOpen(false);
                    setAdjustError(null);
                  }}
                  className="p-1 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Target Resource
                  </label>
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-secondary cursor-pointer"
                  >
                    {inventory?.map((item) => (
                      <option key={item.resource_id} value={item.resource_id}>
                        {item.resource_name} (Current: {item.quantity} {item.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Adjustment Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustType('MANUAL_IN')}
                        className={cn(
                          'py-2 text-xs font-bold border rounded flex items-center justify-center gap-1.5 transition-colors',
                          adjustType === 'MANUAL_IN'
                            ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400'
                            : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900',
                        )}
                      >
                        <PlusCircle size={14} />
                        INGRESS (ADD)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType('MANUAL_OUT')}
                        className={cn(
                          'py-2 text-xs font-bold border rounded flex items-center justify-center gap-1.5 transition-colors',
                          adjustType === 'MANUAL_OUT'
                            ? 'bg-red-950/20 border-red-500 text-red-400'
                            : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900',
                        )}
                      >
                        <MinusCircle size={14} />
                        EGRESS (SUB)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Quantity Change
                    </label>
                    <input
                      required
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={adjustQuantity}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/[^0-9]/g, '');
                        setAdjustQuantity(cleaned);
                      }}
                      placeholder="e.g. 50000"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Modification Justification Note
                  </label>
                  <textarea
                    value={adjustDescription}
                    onChange={(e) => setAdjustDescription(e.target.value)}
                    placeholder="e.g. Discovered 5 crates of canned beans in warehouse basement near Highway 10."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary resize-none"
                  />
                </div>

                {adjustError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
                    <p className="text-xs font-mono text-red-400 leading-relaxed">{adjustError}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdjustOpen(false);
                      setAdjustError(null);
                    }}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    ABORT ADJUSTMENT
                  </button>
                  <button
                    type="submit"
                    disabled={adjustMutation.isPending || !adjustQuantity}
                    className="flex-1 py-2.5 bg-brand-secondary text-black text-xs font-black uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30"
                  >
                    {adjustMutation.isPending ? 'TRANSMITTING ACTION...' : 'AUTHORIZE STOCK ENTRY'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
