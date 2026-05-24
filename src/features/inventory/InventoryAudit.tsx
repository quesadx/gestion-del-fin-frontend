import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useCampStore } from '../../store';
import { History, ArrowLeft } from 'lucide-react';
import { cn, formatDate } from '../../lib/utils';
import { Pagination } from '../../components/Pagination';
import { Skeleton } from '../../components/Skeleton';

const PAGE_SIZE = 20;

export default function InventoryAudit() {
  const navigate = useNavigate();
  const { currentCampId } = useCampStore();
  const [page, setPage] = useState(1);
  const [selectedType, setSelectedType] = useState<string>('');

  // Fetch resources for name resolution (shares cache with ['resources'] key)
  const { data: resources } = useQuery<any[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 60_000,
  });

  // Build resource ID → name lookup map
  const resourceMap = useMemo(() => {
    const map = new Map<number, string>();
    if (resources && Array.isArray(resources)) {
      for (const r of resources) {
        map.set(r.id, r.name);
      }
    }
    return map;
  }, [resources]);

  // Fetch chronological audit log
  const { data: auditData, isLoading } = useQuery<any[]>({
    queryKey: ['inventory-audit', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/inventory/audit/${currentCampId}`);
      return res.data?.data ?? res.data ?? [];
    },
    enabled: !!currentCampId,
  });

  // Filter by adjustment type
  const filtered = useMemo(() => {
    const entries = Array.isArray(auditData) ? auditData : [];
    if (!selectedType) return entries;
    return entries.filter((e: any) => e.type === selectedType);
  }, [auditData, selectedType]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleTypeFilter = (type: string) => {
    setSelectedType(type);
    setPage(1);
  };

  const resolveResourceName = (entry: any): string => {
    if (entry.resource?.name) return entry.resource.name;
    const name = resourceMap.get(entry.resource_type_id);
    if (name) return name;
    return `Resource #${entry.resource_type_id}`;
  };

  return (
    <div className="space-y-8">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-secondary">
            Inventory Audit Trail
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Chronological event log of all inventory adjustments
          </p>
        </div>
        <button
          onClick={() => navigate('/inventory')}
          className="brutalist-border hover:bg-zinc-900 text-zinc-300 font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
        >
          <ArrowLeft size={18} />
          BACK TO INVENTORY
        </button>
      </div>

      {/* ── Type Filter ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          Type Filter:
        </span>
        <div className="flex gap-1">
          {['', 'MANUAL_IN', 'MANUAL_OUT'].map((type) => (
            <button
              key={type}
              onClick={() => handleTypeFilter(type)}
              className={cn(
                'px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded border transition-colors',
                selectedType === type
                  ? 'bg-brand-secondary/20 border-brand-secondary text-brand-secondary'
                  : 'border-zinc-800 text-zinc-400 hover:bg-zinc-900',
              )}
            >
              {type === '' ? 'ALL' : type === 'MANUAL_IN' ? 'INGRESS' : 'EGRESS'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      {!currentCampId ? (
        /* No camp selected */
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <History className="h-12 w-12 text-zinc-700" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Select a camp to view audit records
          </p>
        </div>
      ) : isLoading ? (
        /* Loading skeleton */
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <History className="h-12 w-12 text-zinc-700" />
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              No audit records found
            </p>
            <p className="text-xs text-zinc-600 font-mono mt-1">
              {selectedType
                ? `No entries of type "${selectedType}" for this camp.`
                : 'No inventory adjustments have been recorded for this camp.'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Audit Table ────────────────────────────────── */}
          <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-surface-raised/40">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                  <th className="py-3 px-4 font-semibold">Resource</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Quantity</th>
                  <th className="py-3 px-4 font-semibold">Description</th>
                  <th className="py-3 px-4 font-semibold">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {paginated.map((entry: any) => {
                  const isIn = entry.type === 'MANUAL_IN';
                  return (
                    <tr
                      key={entry.id ?? entry.resource_type_id}
                      className="hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">
                        {formatDate(entry.created_at ?? entry.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-medium text-zinc-100">
                        {resolveResourceName(entry)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={cn(
                            'inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                            isIn
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-950/40 text-red-400 border-red-500/20',
                          )}
                        >
                          {isIn ? 'INGRESS' : 'EGRESS'}
                        </span>
                      </td>
                      <td
                        className={cn(
                          'py-3 px-4 font-mono font-bold',
                          isIn ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {isIn ? '+' : '-'}
                        {entry.quantity}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                        {entry.description || entry.notes || '—'}
                      </td>
                      <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                        {entry.user?.username ?? entry.username ?? entry.user_id ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ─────────────────────────────────── */}
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
