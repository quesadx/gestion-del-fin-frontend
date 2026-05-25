import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { apiClient } from '../../lib/api';
import { useCampStore } from '../../store';
import { Sandwich, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import { InventoryAuditEntry, Resource } from '../../types';

export default function RationsPage() {
  const { currentCampId } = useCampStore();
  const queryClient = useQueryClient();

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form states
  const [selectedResourceId, setSelectedResourceId] = useState<number>(0);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  // ── Resources lookup ─────────────────────────────────────────────────

  const { data: resources } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 60_000,
  });

  const resourceMap = useMemo(() => {
    const map = new Map<number, string>();
    if (resources && Array.isArray(resources)) {
      for (const r of resources) {
        map.set(r.id, r.name);
      }
    }
    return map;
  }, [resources]);

  const getEntryType = (entry: InventoryAuditEntry): string => {
    const rawType =
      entry.type ??
      (entry as InventoryAuditEntry & { log_type?: string; logType?: string }).log_type ??
      (entry as InventoryAuditEntry & { log_type?: string; logType?: string }).logType ??
      '';

    return String(rawType).trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
  };

  // ── Audit log (for ration history) ────────────────────────────────────

  const { data: auditData, isLoading } = useQuery<InventoryAuditEntry[]>({
    queryKey: ['inventory-audit', currentCampId],
    queryFn: async () => {
      try {
        const res = await apiClient.get(`/inventory/audit/${currentCampId}`);
        return res.data?.data ?? res.data ?? [];
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!currentCampId,
    retry: false,
  });

  // Filter only entries whose description includes "RATION:"
  const rations = useMemo(() => {
    if (!Array.isArray(auditData)) return [];
    return auditData.filter((entry) => {
      const desc = entry.description || entry.notes || '';
      return desc.toUpperCase().includes('RATION:') || desc.toUpperCase().startsWith('RATION');
    });
  }, [auditData]);

  // ── Create ration mutation ────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (payload: {
      camp_id: number;
      resource_type_id: number;
      type: 'MANUAL_OUT';
      quantity: number;
      description: string;
    }) => {
      const res = await apiClient.post('/inventory/adjustment', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['inventory-audit', currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ['inventory', currentCampId],
      });
      setIsCreateOpen(false);
      setQuantity('');
      setNote('');
      setSelectedResourceId(0);
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────

  const resolveResourceName = (entry: InventoryAuditEntry): string => {
    if (entry.resource_name) return entry.resource_name;
    if (entry.resource?.name) return entry.resource.name;
    const name = resourceMap.get(entry.resource_type_id ?? -1);
    if (name) return name;
    return `Resource #${entry.resource_type_id ?? 'unknown'}`;
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!currentCampId || !selectedResourceId || isNaN(qty) || qty <= 0) return;

    createMutation.mutate({
      camp_id: currentCampId,
      resource_type_id: selectedResourceId,
      type: 'MANUAL_OUT',
      quantity: qty,
      description: `RATION: ${note || 'No additional notes'}`,
    });
  };

  const openCreateModal = () => {
    // Pre-select the first available resource
    if (resources && resources.length > 0) {
      setSelectedResourceId(resources[0].id);
    }
    setIsCreateOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-secondary">
            Ration Disbursement
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Track and record daily ration distributions
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-brand-secondary hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
        >
          <Plus size={18} />
          NEW RATION
        </button>
      </div>

      <div className="p-4 bg-surface-raised/50 border border-zinc-800 rounded-lg flex items-center gap-4">
        <div className="p-2 bg-amber-950/30 rounded-lg border border-amber-500/20 shrink-0">
          <Sandwich size={18} className="text-amber-500" />
        </div>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Daily Ration Cycle</p>
            <p className="text-xs font-mono text-zinc-300">
              Automatic consumption runs daily via server cron. Manual audits shown below.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Next Cycle</p>
            <p className="text-xs font-mono text-zinc-500">
              Daily at ~00:00 (server cron) — last cycle info not exposed via API
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {!currentCampId ? (
        /* No camp selected */
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Sandwich className="h-12 w-12 text-zinc-700" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Select a refuge to view ration records
          </p>
        </div>
      ) : isLoading ? (
        /* Loading skeleton */
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : rations.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Sandwich className="h-12 w-12 text-zinc-700" />
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              No ration disbursements recorded
            </p>
            <p className="text-xs text-zinc-600 font-mono mt-1">
              Disburse your first ration to begin tracking distribution history.
            </p>
          </div>
        </div>
      ) : (
        /* ── Rations Table ───────────────────────────────────────── */
        <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-surface-raised/40">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Resource</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Quantity</th>
                <th className="py-3 px-4 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {rations.map((entry, idx: number) => {
                const isDisbursed = getEntryType(entry) === 'MANUAL_OUT';
                return (
                  <motion.tr
                    key={entry.id ?? idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-zinc-900/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">
                      {formatDate(entry.created_at ?? entry.timestamp ?? null)}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-100">
                      {resolveResourceName(entry)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                          isDisbursed
                            ? 'bg-red-950/40 text-red-400 border-red-500/20'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20',
                        )}
                      >
                        {isDisbursed ? 'DISBURSED' : 'RESTOCKED'}
                      </span>
                    </td>
                    <td
                      className={cn(
                        'py-3 px-4 font-mono font-bold',
                        isDisbursed ? 'text-red-400' : 'text-emerald-400',
                      )}
                    >
                      {isDisbursed ? '-' : '+'}
                      {entry.quantity}
                    </td>
                    <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                      {entry.description || entry.notes || '—'}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Ration Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
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
                    DISPENSARY INTERFACE DS-02
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    New Ration Disbursement
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Record a ration distribution from the current refuge stockpile.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="p-1 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Resource</label>
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-secondary cursor-pointer"
                  >
                    {resources?.map((resource: Resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} ({resource.unit})
                      </option>
                    )) ?? (
                      <option value={0} disabled>
                        No resources available
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Quantity</label>
                  <input
                    required
                    type="number"
                    min="1"
                    step="any"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Breakfast distribution to Sector B survivors"
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !quantity || !selectedResourceId}
                    className="flex-1 py-2.5 bg-brand-secondary text-black text-xs font-black uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30"
                  >
                    {createMutation.isPending ? 'DISPENSING...' : 'AUTHORIZE DISTRIBUTION'}
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
