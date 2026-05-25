import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../../lib/api';
import { Camp, Person, InventoryItem, Expedition } from '../../types';
import { can, PERM } from '../../lib/permissions';
import { cn, formatDate } from '../../lib/utils';
import { MapPin, Users, Box, Map, ArrowLeft, AlertCircle, Activity, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';

export default function CampDetail() {
  const { id } = useParams();
  const campId = Number(id);
  const navigate = useNavigate();
  const hasReadAccess = can(PERM.CAMPS_READ);

  // Camp detail query
  const {
    data: camp,
    isLoading: campLoading,
    isError: campError,
  } = useQuery<Camp>({
    queryKey: ['camp', campId],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${campId}`);
      return res.data?.data ?? res.data;
    },
    enabled: hasReadAccess && !isNaN(campId),
  });

  // People count
  const { data: people, isLoading: peopleLoading } = useQuery<Person[]>({
    queryKey: ['camp-people', campId],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${campId}/people`);
      return unwrapList<Person>(res.data);
    },
    enabled: hasReadAccess && !isNaN(campId),
  });

  // Inventory count
  const { data: inventory, isLoading: inventoryLoading } = useQuery<InventoryItem[]>({
    queryKey: ['camp-inventory', campId],
    queryFn: async () => {
      const res = await apiClient.get(`/inventory/${campId}`);
      return unwrapList<InventoryItem>(res.data);
    },
    enabled: hasReadAccess && !isNaN(campId),
  });

  // Expeditions
  const { data: expeditions, isLoading: expeditionsLoading } = useQuery<Expedition[]>({
    queryKey: ['camp-expeditions', campId],
    queryFn: async () => {
      const res = await apiClient.get('/expeditions');
      return unwrapList<Expedition>(res.data);
    },
    enabled: hasReadAccess && !isNaN(campId),
  });

  if (!hasReadAccess) {
    return <Navigate to="/" replace />;
  }

  // ── Loading state ───────────────────────────────────────────────────────

  if (campLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-40" />
        <div className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found / invalid ID ──────────────────────────────────────────────

  if (isNaN(campId) || campError || !camp) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Refuge Not Found</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            The refuge with ID "{id}" does not exist or has been decommissioned.
          </p>
        </div>
        <button
          onClick={() => navigate('/camps')}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md inline-flex items-center gap-2 text-sm transition-all"
        >
          <ArrowLeft size={16} />
          BACK TO REFUGES
        </button>
      </div>
    );
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  // Active expeditions for this camp (ONGOING status)
  const activeExpeditions = expeditions?.filter(
    (e) => e.camp_id === campId && e.status === 'ONGOING',
  );

  const statsLoading = peopleLoading || inventoryLoading || expeditionsLoading;

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/camps')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft size={14} />
        BACK TO REFUGES
      </button>

      {/* Camp info card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl space-y-6"
      >
        {/* Header row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">
              {camp.name}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {camp.location || 'Undisclosed Sector'}
              </span>
              <span className="text-zinc-800 select-none">|</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(camp.created_at)}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              'px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 self-start',
              camp.status === 'ACTIVE'
                ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
            )}
          >
            {camp.status}
          </span>
        </div>

        {/* AI context prompt */}
        <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-400">
          <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1.5">
            AI Stability Overwatch Context
          </p>
          <p className="italic">
            "
            {camp.ai_context_prompt ||
              'No override prompt defined. Standard quarantine measures active.'}
            "
          </p>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-4">
          <span>
            REFUGE SIGNATURE ID // GF-
            {camp.id.toString().padStart(3, '0')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity size={10} className="text-emerald-500 animate-pulse" />
            ONLINE
          </span>
        </div>
      </motion.div>

      {/* Stats section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Refuge Statistics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              {/* Survivors */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                  <Users size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black font-mono">{people?.length ?? 0}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Survivors
                  </p>
                </div>
              </motion.div>

              {/* Inventory items */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center text-amber-500">
                  <Box size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black font-mono">{inventory?.length ?? 0}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Inventory Items
                  </p>
                </div>
              </motion.div>

              {/* Active expeditions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                  <Map size={20} />
                </div>
                <div>
                  <p className="text-2xl font-black font-mono">{activeExpeditions?.length ?? 0}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    Active Expeditions
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/population"
          className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-zinc-700 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all"
        >
          <Users size={16} />
          VIEW POPULATION
        </Link>
        <Link
          to="/inventory"
          className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-zinc-700 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all"
        >
          <Box size={16} />
          VIEW INVENTORY
        </Link>
      </div>
    </div>
  );
}
