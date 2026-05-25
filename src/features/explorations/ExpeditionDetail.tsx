import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../../lib/api';
import { Expedition, ResourceAllocation, Resource } from '../../types';
import { useAuthStore, useCampStore } from '../../store';
import { can, PERM } from '../../lib/permissions';
import { cn, formatDate } from '../../lib/utils';
import {
  MapPin,
  Calendar,
  Users,
  Package,
  Gift,
  ArrowLeft,
  AlertCircle,
  Timer,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';

type ExpeditionResponse = Expedition & {
  expedition_members?: Expedition['members'];
  expedition_allocated_resources?: ResourceAllocation[];
  expedition_found_resources?: ResourceAllocation[];
};

export default function ExpeditionDetail() {
  const { id } = useParams();
  const expeditionId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentCampId } = useCampStore();
  const queryClient = useQueryClient();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [foundResources, setFoundResources] = useState<
    { resource_type_id: number; amount: number }[]
  >([]);

  const actorId = user?.id ?? 1;
  const canRead = can(PERM.EXPEDITIONS_READ);

  useEffect(() => {
    if (!canRead) {
      navigate('/', { replace: true });
    }
  }, [canRead, navigate]);

  // Fetch expedition detail
  const {
    data: expedition,
    isLoading,
    isError,
  } = useQuery<ExpeditionResponse>({
    queryKey: ['expedition', expeditionId],
    queryFn: async () => {
      const res = await apiClient.get(`/expeditions/${expeditionId}`);
      return res.data?.data ?? res.data;
    },
    enabled: canRead && !isNaN(expeditionId),
  });

  // Fetch resources list for resource name resolution
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return unwrapList<Resource>(res.data);
    },
    enabled: canRead,
  });

  // Map of resource_type_id -> { name, unit }
  const resourceMap = new Map<number, { name: string; unit: string }>();
  (resources ?? []).forEach((r) => resourceMap.set(r.id, { name: r.name, unit: r.unit }));

  const expeditionMembers = expedition?.expedition_members ?? expedition?.members ?? [];
  const expeditionAllocatedResources =
    expedition?.expedition_allocated_resources ?? expedition?.allocated_resources ?? [];
  const expeditionFoundResources =
    expedition?.expedition_found_resources ?? expedition?.found_resources ?? [];

  const formatAmount = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '0';
    return Number(value).toLocaleString();
  };

  // Status mutation (deploy squad, mark lost)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      actual_return_date,
      resources_to_return,
    }: {
      status: string;
      actual_return_date?: string;
      resources_to_return?: ResourceAllocation[];
    }) => {
      const body: Record<string, number | string | ResourceAllocation[] | undefined> = {
        status,
        changed_by: actorId,
      };
      if (actual_return_date) body.actual_return_date = actual_return_date;
      if (resources_to_return?.length) body.resources_to_return = resources_to_return;

      try {
        const res = await apiClient.patch(`/expeditions/${expeditionId}/status`, body);
        return res.data;
      } catch (error) {
        const axiosError = error as { response?: { status?: number } };
        if (![404, 405].includes(axiosError.response?.status ?? -1)) {
          throw error;
        }
        const legacyRes = await apiClient.put(`/expeditions/${expeditionId}`, {
          status,
          ...(actual_return_date ? { actual_return_date } : {}),
        });
        return legacyRes.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition', expeditionId] });
      queryClient.invalidateQueries({
        queryKey: ['expeditions', currentCampId],
      });
      queryClient.invalidateQueries({
        queryKey: ['dashboard-metrics', currentCampId],
      });
    },
  });

  if (!canRead) {
    return null;
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-40" />
        <div className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found / error ──────────────────────────────────────────────────

  if (isNaN(expeditionId) || isError || !expedition) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Expedition Not Found</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            The expedition with ID "{id}" does not exist or has been decommissioned.
          </p>
        </div>
        <button
          onClick={() => navigate('/expeditions')}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md inline-flex items-center gap-2 text-sm transition-all"
        >
          <ArrowLeft size={16} />
          BACK TO EXPEDITIONS
        </button>
      </div>
    );
  }

  const isOngoing = expedition.status === 'ONGOING';
  const isPlanned = expedition.status === 'PLANNED';
  const isReturned = expedition.status === 'RETURNED';
  const isCancelled = expedition.status === 'CANCELLED';
  const isReadonly = isReturned || isCancelled;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/expeditions')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft size={14} />
        BACK TO EXPEDITIONS
      </button>

      {/* Expedition info card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">
              {expedition.destination}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {expedition.destination}
              </span>
              <span className="text-zinc-800 select-none">|</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(expedition.departure_date)}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              'px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 self-start',
              isOngoing
                ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                : isReturned
                  ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                  : isCancelled
                    ? 'bg-red-950/20 text-red-500 border-red-500/30'
                    : 'bg-zinc-950/20 text-zinc-500 border-zinc-700/50',
            )}
          >
            {expedition.status}
          </span>
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Departure
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {formatDate(expedition.departure_date)}
            </p>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Expected Return
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {expedition.expected_return_date ? formatDate(expedition.expected_return_date) : '—'}
            </p>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Max Return
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {expedition.max_return_date ? formatDate(expedition.max_return_date) : '—'}
            </p>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Actual Return
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {expedition.actual_return_date
                ? formatDate(expedition.actual_return_date)
                : isReturned
                  ? 'Recorded'
                  : 'Not yet returned'}
            </p>
          </div>
        </div>

        {/* Notes */}
        {expedition.notes && (
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-400">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1.5">
              Mission Briefing
            </p>
            <p className="italic whitespace-pre-wrap">"{expedition.notes}"</p>
          </div>
        )}

        {/* Action buttons */}
        {!isReadonly && (
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-900/50 pt-4">
            {isPlanned && (
              <button
                onClick={() => updateStatusMutation.mutate({ status: 'ONGOING' })}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 bg-brand-primary text-black font-extrabold text-xs uppercase rounded hover:bg-brand-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'DEPLOYING...' : 'DEPLOY SQUAD'}
              </button>
            )}
            {isOngoing && (
              <>
                <button
                  onClick={() => {
                    setFoundResources([]);
                    setReturnDate(new Date().toISOString().split('T')[0]);
                    setShowReturnModal(true);
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs uppercase rounded hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  CONFIRM RETURN
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ status: 'CANCELLED' })}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white font-extrabold text-xs uppercase rounded hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  MARK LOST
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-4">
          <span>
            EXPEDITION SIGNATURE ID // EX-
            {expedition.id.toString().padStart(3, '0')}
          </span>
          {isOngoing && (
            <span className="inline-flex items-center gap-1">
              <Timer size={10} className="text-amber-500 animate-pulse" />
              IN PROGRESS
            </span>
          )}
        </div>
      </motion.div>

      {/* Members section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Users size={16} />
          Expedition Members
        </h2>
        <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
          {expeditionMembers && expeditionMembers.length > 0 ? (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Person ID
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">Role</th>
                </tr>
              </thead>
              <tbody>
                {expeditionMembers.map((m, i: number) => (
                  <tr
                    key={m.person_id ?? i}
                    className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-zinc-300">{m.person_id ?? '—'}</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {(m as { role?: string }).role ?? 'Assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
              <Users size={14} />
              {expedition?.expedition_members === undefined && expedition?.members === undefined
                ? 'Member data not included in response'
                : 'No members assigned'}
            </div>
          )}
        </div>
      </div>

      {/* Allocated resources */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Package size={16} />
          Allocated Resources
        </h2>
        <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
          {expeditionAllocatedResources && expeditionAllocatedResources.length > 0 ? (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                    Resource
                  </th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {expeditionAllocatedResources.map((r, i: number) => (
                  <tr
                    key={r.resource_type_id ?? i}
                    className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-zinc-300">
                      {resourceMap.get(r.resource_type_id)?.name ??
                        `Resource #${r.resource_type_id}`}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 text-right font-bold">
                      {formatAmount(r.amount)}{' '}
                      <span className="text-zinc-600 font-normal">
                        {resourceMap.get(r.resource_type_id)?.unit ?? ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
              <Package size={14} />
              {expedition?.expedition_allocated_resources === undefined &&
              expedition?.allocated_resources === undefined
                ? 'Allocated resource data not included in response'
                : 'No allocated resources'}
            </div>
          )}
        </div>
      </div>

      {/* Found resources */}
      {isReturned && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
            <Gift size={16} />
            Found Resources
          </h2>
          <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
            {expeditionFoundResources && expeditionFoundResources.length > 0 ? (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500">
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]">
                      Resource
                    </th>
                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right">
                      Quantity Found
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expeditionFoundResources.map((r, i: number) => (
                    <tr
                      key={r.resource_type_id ?? i}
                      className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-300">
                        {resourceMap.get(r.resource_type_id)?.name ??
                          `Resource #${r.resource_type_id}`}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-right font-bold">
                        {formatAmount(r.amount)}{' '}
                        <span className="text-zinc-600 font-normal">
                          {resourceMap.get(r.resource_type_id)?.unit ?? ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
                <Gift size={14} />
                {expedition?.expedition_found_resources === undefined &&
                expedition?.found_resources === undefined
                  ? 'Found resource data not included in response'
                  : 'No found resources recorded'}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Return Modal ─────────────────────────────────────────────────── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
          >
            <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
              <div>
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  TACTICAL INTERFACE EX-10
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  CONFIRM EXPEDITION RETURN
                </h3>
                <p className="text-[10px] font-mono text-zinc-600 mt-1">{expedition.destination}</p>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1 text-zinc-500 hover:text-white rounded"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateStatusMutation.mutate(
                  {
                    status: 'RETURNED',
                    actual_return_date: returnDate,
                    resources_to_return: foundResources.filter(
                      (r) => r.resource_type_id && r.amount > 0,
                    ),
                  },
                  { onSettled: () => setShowReturnModal(false) },
                );
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Return Date</label>
                <input
                  required
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  FOUND RESOURCES (optional)
                </label>
                {foundResources.map((row, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={row.resource_type_id || ''}
                      onChange={(e) => {
                        const updated = [...foundResources];
                        updated[idx] = {
                          ...updated[idx],
                          resource_type_id: Number(e.target.value),
                        };
                        setFoundResources(updated);
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    >
                      <option value="">Select resource…</option>
                      {(resources ?? []).map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={row.amount || ''}
                      onChange={(e) => {
                        const updated = [...foundResources];
                        updated[idx] = {
                          ...updated[idx],
                          amount: Number(e.target.value),
                        };
                        setFoundResources(updated);
                      }}
                      placeholder="Qty"
                      className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setFoundResources(foundResources.filter((_, i) => i !== idx))}
                      className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setFoundResources([...foundResources, { resource_type_id: 0, amount: 0 }])
                  }
                  className="text-[10px] font-bold text-brand-primary uppercase hover:text-brand-primary/80 transition-colors"
                >
                  + ADD RESOURCE
                </button>
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="flex-2 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase rounded hover:bg-emerald-500 transition-colors disabled:opacity-30"
                >
                  {updateStatusMutation.isPending ? 'PROCESSING...' : 'CONFIRM RETURN'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
