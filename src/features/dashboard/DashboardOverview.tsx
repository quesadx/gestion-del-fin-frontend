import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, unwrapList } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import {
  Users,
  Map,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  ShieldCheck,
  Box,
  CheckCircle,
  HardHat,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';
import { InventorySnapshot, Resource, InventoryItem, Person } from '../../types';
import BorderGlow from '../../components/BorderGlow';

const ADMIN_ROLES = ['system_admin', 'resource_manager', 'travel_coordinator'];

export default function DashboardOverview() {
  const { currentCampId } = useCampStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const isWorker = user?.role === 'worker';
  const isAdmin = user?.role ? ADMIN_ROLES.includes(user.role) : false;

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['dashboard-metrics', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get('/metrics/dashboard');
      const d = res.data ?? {};
      return {
        people: {
          total: d.survivor_count ?? d.people?.total ?? 0,
          healthy: d.healthy_count ?? d.people?.healthy ?? 0,
          sick: d.sick_count ?? d.people?.sick ?? 0,
          injured: d.injured_count ?? d.people?.injured ?? 0,
          away: d.absent_count ?? d.people?.away ?? 0,
          dead: d.dead_count ?? d.people?.dead ?? 0,
        },
        resources: {
          total_types: d.resource_types_count ?? d.resources?.total_types ?? 0,
          low_stock: d.resources?.low_stock ?? Array(d.low_resource_alerts_count ?? 0).fill({}),
        },
        expeditions: {
          active: d.active_expeditions_count ?? d.expeditions?.active ?? 0,
          planned: d.planned_expeditions_count ?? d.expeditions?.planned ?? 0,
          completed: d.completed_expeditions_count ?? d.expeditions?.completed ?? 0,
        },
        transfers: {
          pending: d.pending_transfers_count ?? d.transfers?.pending ?? 0,
          in_transit: d.in_transit_transfers_count ?? d.transfers?.in_transit ?? 0,
        },
      };
    },
    enabled: !!currentCampId && isAdmin,
  });

  const { data: peopleList, isLoading: peopleLoading } = useQuery<Person[]>({
    queryKey: ['worker-people', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${currentCampId}/people`);
      return unwrapList<Person>(res.data);
    },
    enabled: !!currentCampId && isWorker,
  });
  const survivorCount = isWorker ? (peopleList?.length ?? 0) : (metrics?.people?.total ?? 0);
  const healthyCount = isWorker
    ? (peopleList?.filter((p) => p.status === 'HEALTHY').length ?? 0)
    : (metrics?.people?.healthy ?? 0);

  const { data: rawInventory, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resource-metrics', currentCampId],
    queryFn: async () => {
      const [invRes, resRes] = await Promise.all([
        apiClient.get(`/inventory/${currentCampId}`),
        apiClient.get('/resources'),
      ]);
      const items: InventoryItem[] = unwrapList<InventoryItem>(invRes.data);
      const resourceTypes: Resource[] = unwrapList<Resource>(resRes.data);
      return { items, resourceTypes };
    },
    enabled: !!currentCampId,
  });

  const resourceSummaries: InventorySnapshot[] = useMemo(() => {
    if (!rawInventory) return [];

    const { items, resourceTypes } = rawInventory;

    return items.map((item) => {
      const rt = resourceTypes.find((r) => r.id === item.resource_type_id) ?? item.resource_type;
      const name =
        item.resource_name ??
        item.resource_type?.name ??
        rt?.name ??
        `Resource #${item.resource_type_id}`;
      const unit = item.unit ?? item.resource_type?.unit ?? rt?.unit ?? '';
      const qty = item.quantity ?? 0;
      const minStock = Number(rt?.minimum_stock ?? item.minimum_stock ?? 0);
      const dailyRation = Number((rt as Resource | undefined)?.daily_ration ?? 0);
      const dailyUsage = dailyRation * survivorCount;
      const projectionDays = dailyUsage > 0 ? Math.floor(qty / dailyUsage) : null;
      return {
        resource_id: item.resource_type_id,
        resource_name: name,
        unit,
        quantity: qty,
        minimum_stock: minStock,
        daily_ration: dailyRation,
        daily_usage: dailyUsage,
        projection_days: projectionDays,
        status: (qty < minStock ? (qty < minStock / 2 ? 'CRITICAL' : 'LOW') : 'OK') as
          | 'OK'
          | 'LOW'
          | 'CRITICAL',
      } satisfies InventorySnapshot;
    }) as InventorySnapshot[];
  }, [rawInventory, survivorCount]);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) return;

    const updateSize = () => {
      const next = {
        width: element.clientWidth,
        height: element.clientHeight,
      };

      setChartSize((prev) =>
        prev.width === next.width && prev.height === next.height ? prev : next,
      );
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) return;

    const next = { width: element.clientWidth, height: element.clientHeight };
    setChartSize((prev) =>
      prev.width === next.width && prev.height === next.height ? prev : next,
    );
  }, [resourceSummaries]);

  if (!currentCampId) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <TrendingUp size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">No Refuge Selected</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            Select a camp from the header to load real-time operational data.
          </p>
        </div>
      </div>
    );
  }

  const criticalCount = (resourceSummaries ?? []).filter((r) => r.status === 'CRITICAL').length;
  const lowCount = (resourceSummaries ?? []).filter((r) => r.status === 'LOW').length;

  const adminCards = [
    {
      label: 'Survivors',
      value: metrics?.people?.total,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Active Expeditions',
      value: metrics?.expeditions?.active,
      icon: Map,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Stock Alerts',
      value: metrics?.resources?.low_stock?.length ?? 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Pending Transfers',
      value: metrics?.transfers?.pending,
      icon: ClipboardList,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    },
  ];

  const workerCards = [
    {
      label: 'Survivors',
      value: survivorCount,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Healthy',
      value: healthyCount,
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Stock Alerts',
      value: criticalCount + lowCount,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    },
    {
      label: 'Resource Types',
      value: resourceSummaries?.length ?? 0,
      icon: Box,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    },
  ];

  const statCards = isWorker ? workerCards : adminCards;
  const cardCount = statCards.length;
  const isLoading = isWorker ? peopleLoading : metricsLoading;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            {isWorker ? 'Camp Status' : 'Operational Overview'}
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            {isWorker
              ? 'Camp Resources & Population'
              : 'Resource & Population Surveillance // Stability Alpha-7'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-lg">
          {isWorker ? (
            <HardHat size={18} className="text-amber-500" />
          ) : (
            <ShieldCheck size={18} className="text-brand-accent" />
          )}
          <div className="text-[10px] font-mono leading-none">
            <p className="text-zinc-300 font-bold uppercase">
              {isWorker ? 'Worker Access' : 'Integrity Status'}
            </p>
            <p className={isWorker ? 'text-amber-500 uppercase' : 'text-brand-accent uppercase'}>
              {isWorker ? 'Read-Only' : 'Synchronized'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: cardCount }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <BorderGlow
                  backgroundColor="#1b0b0c"
                  borderRadius={16}
                  glowColor="356 78 62"
                  glowIntensity={0.7}
                  glowRadius={24}
                  edgeSensitivity={20}
                  coneSpread={18}
                  animated={false}
                  className="h-full"
                >
                  <div className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-4 hover:border-zinc-700 transition-colors h-full">
                    <div
                      className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}
                    >
                      <stat.icon size={20} />
                    </div>
                    {stat.label === 'Stock Alerts' ? (
                      <div className="space-y-3">
                        {criticalCount === 0 && lowCount === 0 ? (
                          <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle size={16} />
                            <span className="text-sm font-bold font-mono">All stocks optimal</span>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            {criticalCount > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                                <span className="text-xl font-black font-mono text-red-500">
                                  {criticalCount}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  CRITICAL
                                </span>
                              </div>
                            )}
                            {lowCount > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span className="text-xl font-black font-mono text-amber-500">
                                  {lowCount}
                                </span>
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  LOW
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        <button
                          onClick={() => navigate('/inventory')}
                          className="text-[10px] font-black uppercase tracking-wider text-brand-secondary hover:text-amber-400 transition-colors"
                        >
                          View Details →
                        </button>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {stat.label}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-2xl font-black font-mono">{stat.value ?? 0}</p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {stat.label}
                        </p>
                      </div>
                    )}
                  </div>
                </BorderGlow>
              </motion.div>
            ))}
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <Box size={16} className="text-brand-secondary" />
              Resource Deployment Analysis
            </h3>
            <span className="text-[10px] font-mono text-zinc-600">Real-time Telemetry Active</span>
          </div>

          {resourcesLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-64 bg-surface-raised/30 brutalist-border rounded-xl p-6 flex flex-col justify-between">
                <Skeleton className="h-4 w-1/4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 bg-surface-raised/50 border border-zinc-800 rounded-lg space-y-3"
                  >
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-2 w-2 rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-12" />
                    <div className="space-y-1">
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-1 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : !resourceSummaries || resourceSummaries.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest border border-zinc-900 rounded-xl">
              No inventory data available for this refuge.
            </div>
          ) : (
            <>
              <div className="h-64 bg-surface-raised/30 brutalist-border rounded-xl p-4 min-w-0">
                <div ref={chartContainerRef} className="w-full h-full min-w-25 min-h-25">
                  {chartSize.width > 0 && chartSize.height > 0 && (
                    <BarChart
                      width={chartSize.width}
                      height={chartSize.height}
                      layout="vertical"
                      data={resourceSummaries}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#1b0b0c" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="resource_name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: '#71717a',
                          fontSize: 10,
                          fontWeight: 'bold',
                        }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{
                          backgroundColor: '#0c0708',
                          border: '1px solid #2a0f10',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="quantity" radius={[0, 4, 4, 0]} barSize={20}>
                        {resourceSummaries?.map((entry: InventorySnapshot, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              [
                                '#ef4444',
                                '#f59e0b',
                                '#10b981',
                                '#3b82f6',
                                '#8b5cf6',
                                '#ec4899',
                                '#06b6d4',
                                '#f97316',
                                '#14b8a6',
                                '#e11d48',
                              ][index % 10]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                {resourceSummaries?.map((res: InventorySnapshot) => (
                  <BorderGlow
                    key={res.resource_id}
                    backgroundColor="#1b0b0c"
                    borderRadius={14}
                    glowColor={res.status === 'CRITICAL' ? '356 82 60' : '36 88 58'}
                    glowIntensity={0.55}
                    glowRadius={20}
                    edgeSensitivity={18}
                    coneSpread={18}
                    animated={false}
                    className="h-full"
                  >
                    <div className="p-4 bg-surface-raised/50 border border-zinc-800 rounded-lg flex flex-col justify-between group h-full">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase">
                          {res.resource_name}
                        </p>
                        <div
                          className={cn(
                            'w-2 h-2 rounded-full animate-pulse',
                            res.status === 'CRITICAL'
                              ? 'bg-red-500'
                              : res.status === 'LOW'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500',
                          )}
                        />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black font-mono tracking-tight">
                          {res.quantity}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-600 uppercase">
                          {res.unit}
                        </span>
                      </div>
                      <div className="mt-3 space-y-1">
                        <p className="text-[9px] font-bold text-zinc-500 uppercase flex justify-between">
                          Est. Durability
                          <span
                            className={cn(
                              (res.projection_days || 0) < 5 ? 'text-red-500' : 'text-zinc-400',
                            )}
                          >
                            {res.projection_days != null ? `${res.projection_days} DAYS` : 'N/A'}
                          </span>
                        </p>
                        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full',
                              (res.projection_days || 0) < 5 ? 'bg-red-500' : 'bg-zinc-600',
                            )}
                            style={{
                              width: `${Math.min((res.projection_days || 0) * 10, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </BorderGlow>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}