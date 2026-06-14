import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient, unwrapList } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission, canAccessCamp } from '../../lib/permissions';
import { useDeniedPermissionsStore } from '../../store/deniedPermissions';
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
import { InventorySnapshot, Resource, InventoryItem, Person, Expedition } from '../../types';
import BorderGlow from '../../components/BorderGlow';

const API_LIST_PAGE_SIZE = 100;

type DashboardMetrics = {
  people: {
    total: number;
    healthy: number;
    sick: number;
    injured: number;
    away: number;
    dead: number;
  };
  resources: {
    totalTypes: number;
    lowStockCount: number;
  };
  expeditions: {
    active: number;
    planned: number;
    completed: number;
  };
  transfers: {
    pending: number;
    inTransit: number;
  };
};

type DashboardTransfer = {
  id: number;
  requesting_camp: number;
  target_camp: number;
  status: 'PENDING' | 'APPROVED_SOURCE' | 'APPROVED_TARGET' | 'COMPLETED' | 'REJECTED';
};

type DashboardProfile = 'admin' | 'operations' | 'resources' | 'limited';

type StatCard = {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  bg: string;
};

const getTotalPagesFromResponse = (responseData: unknown) =>
  Math.max(
    1,
    Number((responseData as { pagination?: { totalPages?: number } })?.pagination?.totalPages) || 1,
  );

async function fetchAllPaginated<T>(url: string, params: Record<string, unknown> = {}) {
  const firstPage = await apiClient.get(url, {
    params: { ...params, page: 1, pageSize: API_LIST_PAGE_SIZE },
  });
  const firstPageItems = unwrapList<T>(firstPage.data);
  const totalPages = getTotalPagesFromResponse(firstPage.data);

  if (totalPages === 1) return firstPageItems;

  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, async (_, index) => {
      const pageNumber = index + 2;
      const res = await apiClient.get(url, {
        params: { ...params, page: pageNumber, pageSize: API_LIST_PAGE_SIZE },
      });
      return unwrapList<T>(res.data);
    }),
  );

  return firstPageItems.concat(...remainingPages);
}

export default function DashboardOverview() {
  const { currentCampId } = useCampStore();
  const { user } = useAuthStore();
  useDeniedPermissionsStore();
  const navigate = useNavigate();
  const canViewMetrics = hasPermission(user?.permissions, 'metrics.dashboard');
  const canBypassCampScoping = hasPermission(user?.permissions, 'admin.bypass_camp_scoping');
  const canReadPeople = hasPermission(user?.permissions, 'people.read');
  const canReadInventory = hasPermission(user?.permissions, 'inventory.read');
  const canReadResources = hasPermission(user?.permissions, 'resources.read');
  const canReadExpeditions = hasPermission(user?.permissions, 'expeditions.read');
  const canReadTransfers = hasPermission(user?.permissions, 'transfers.read');
  const canViewSelectedCamp = Boolean(
    currentCampId && (canBypassCampScoping || canAccessCamp(currentCampId)),
  );
  const canUseTokenMetrics = Boolean(
    currentCampId && user?.camp_id === currentCampId && canViewMetrics,
  );

  const { data: tokenMetrics, isLoading: metricsLoading } = useQuery<DashboardMetrics>({
    queryKey: ['dashboard-metrics', user?.camp_id],
    queryFn: async () => {
      const res = await apiClient.get('/metrics/dashboard');
      const d = res.data ?? {};
      return {
        people: {
          total: Number(d.survivor_count ?? d.people?.total ?? 0),
          healthy: Number(d.healthy_count ?? d.people?.healthy ?? 0),
          sick: Number(d.sick_count ?? d.people?.sick ?? 0),
          injured: Number(d.injured_count ?? d.people?.injured ?? 0),
          away: Number(d.absent_count ?? d.people?.away ?? 0),
          dead: Number(d.dead_count ?? d.people?.dead ?? 0),
        },
        resources: {
          totalTypes: Number(d.resource_types_count ?? d.resources?.total_types ?? 0),
          lowStockCount: Number(d.low_resource_alerts_count ?? d.resources?.low_stock?.length ?? 0),
        },
        expeditions: {
          active: Number(d.active_expeditions_count ?? d.expeditions?.active ?? 0),
          planned: Number(d.planned_expeditions_count ?? d.expeditions?.planned ?? 0),
          completed: Number(d.completed_expeditions_count ?? d.expeditions?.completed ?? 0),
        },
        transfers: {
          pending: Number(d.pending_transfers_count ?? d.transfers?.pending ?? 0),
          inTransit: Number(d.in_transit_transfers_count ?? d.transfers?.in_transit ?? 0),
        },
      };
    },
    enabled: canUseTokenMetrics,
  });

  const { data: peopleList, isLoading: peopleLoading } = useQuery<Person[]>({
    queryKey: ['people', currentCampId, 'dashboard'],
    queryFn: async () => {
      return fetchAllPaginated<Person>(`/camps/${currentCampId}/people`);
    },
    enabled: canViewSelectedCamp && canReadPeople,
  });

  const { data: rawInventory, isLoading: resourcesLoading } = useQuery({
    queryKey: ['resource-metrics', currentCampId],
    queryFn: async () => {
      try {
        const [items, resourceTypes] = await Promise.all([
          fetchAllPaginated<InventoryItem>(`/inventory/${currentCampId}`),
          canReadResources ? fetchAllPaginated<Resource>('/resources') : Promise.resolve([]),
        ]);
        return { items, resourceTypes };
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) return { items: [], resourceTypes: [] };
        throw err;
      }
    },
    enabled: canViewSelectedCamp && canReadInventory,
  });

  const { data: expeditions, isLoading: expeditionsLoading } = useQuery<Expedition[]>({
    queryKey: ['expeditions', currentCampId, 'dashboard'],
    queryFn: async () => {
      return fetchAllPaginated<Expedition>('/expeditions', { camp_id: currentCampId });
    },
    enabled: canViewSelectedCamp && canReadExpeditions,
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery<DashboardTransfer[]>({
    queryKey: ['transfers', currentCampId, 'dashboard'],
    queryFn: async () => {
      return fetchAllPaginated<DashboardTransfer>('/transfers', { camp_id: currentCampId });
    },
    enabled: canViewSelectedCamp && canReadTransfers,
  });

  const survivorCount = canReadPeople
    ? (peopleList?.filter((p) => p.status !== 'DEAD').length ?? 0)
    : (tokenMetrics?.people.total ?? 0);
  const healthyCount = canReadPeople
    ? (peopleList?.filter((p) => p.status === 'HEALTHY').length ?? 0)
    : (tokenMetrics?.people.healthy ?? 0);
  const activeExpeditionsCount = canReadExpeditions
    ? (expeditions?.filter((expedition) => expedition.status === 'ONGOING').length ?? 0)
    : (tokenMetrics?.expeditions.active ?? 0);
  const pendingTransfersCount = canReadTransfers
    ? (transfers?.filter((transfer) => transfer.status === 'PENDING').length ?? 0)
    : (tokenMetrics?.transfers.pending ?? 0);

  const resourceSummaries: InventorySnapshot[] = useMemo(() => {
    if (!rawInventory) return [];

    const { items, resourceTypes } = rawInventory;

    return items.map((item) => {
      const rt = resourceTypes.find((r) => r.id === item.resource_type_id) ?? item.resource_type;
      const resourceLookup = resourceTypes.find((r) => r.id === item.resource_type_id);
      const name =
        item.resource_name ??
        item.resource_type?.name ??
        rt?.name ??
        `Resource #${item.resource_type_id}`;
      const unit = item.unit ?? item.resource_type?.unit ?? rt?.unit ?? '';
      const qty = Number(item.quantity ?? 0);
      const minStock = Number(rt?.minimum_stock ?? item.minimum_stock ?? 0);
      const dailyRation = Number(resourceLookup?.daily_ration ?? 0);
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

  const dashboardProfile: DashboardProfile = canBypassCampScoping
    ? 'admin'
    : canReadExpeditions || canReadTransfers
      ? 'operations'
      : canReadInventory || canReadResources
        ? 'resources'
        : 'limited';

  const profileCopy: Record<
    DashboardProfile,
    {
      title: string;
      subtitle: string;
      label: string;
      status: string;
      icon: typeof Users;
      className: string;
    }
  > = {
    admin: {
      title: 'Operational Overview',
      subtitle: 'Selected Refuge Administrative Telemetry',
      label: 'Admin Scope',
      status: 'Camp Selected',
      icon: ShieldCheck,
      className: 'text-brand-accent uppercase',
    },
    operations: {
      title: 'Operations Dashboard',
      subtitle: 'Expedition & Transfer Surveillance',
      label: 'Operations Scope',
      status: 'Camp Bound',
      icon: Map,
      className: 'text-brand-secondary uppercase',
    },
    resources: {
      title: 'Resource Dashboard',
      subtitle: 'Camp Resource & Inventory Surveillance',
      label: 'Resource Scope',
      status: 'Camp Bound',
      icon: Box,
      className: 'text-brand-secondary uppercase',
    },
    limited: {
      title: 'Camp Status',
      subtitle: 'Limited Camp Telemetry',
      label: 'Limited Scope',
      status: 'Camp Bound',
      icon: HardHat,
      className: 'text-amber-500 uppercase',
    },
  };

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

  if (!canViewSelectedCamp) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <ShieldCheck size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Refuge Access Restricted</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            Your current role can only load dashboard data for its assigned refuge.
          </p>
        </div>
      </div>
    );
  }

  const criticalCount = (resourceSummaries ?? []).filter((r) => r.status === 'CRITICAL').length;
  const lowCount = (resourceSummaries ?? []).filter((r) => r.status === 'LOW').length;
  const stockAlertCount = canReadInventory
    ? criticalCount + lowCount
    : (tokenMetrics?.resources.lowStockCount ?? 0);
  const resourceTypeCount = canReadInventory
    ? resourceSummaries.length
    : (tokenMetrics?.resources.totalTypes ?? 0);
  const profile = profileCopy[dashboardProfile];
  const ProfileIcon = profile.icon;

  const statCards: StatCard[] = [];

  if (canReadPeople || tokenMetrics) {
    statCards.push({
      label: 'Active Survivors',
      value: survivorCount,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    });
  }

  if (canReadPeople) {
    statCards.push({
      label: 'Healthy',
      value: healthyCount,
      icon: ShieldCheck,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    });
  }

  if (canReadExpeditions || tokenMetrics) {
    statCards.push({
      label: 'Active Expeditions',
      value: activeExpeditionsCount,
      icon: Map,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    });
  }

  if (canReadTransfers || tokenMetrics) {
    statCards.push({
      label: 'Pending Transfers',
      value: pendingTransfersCount,
      icon: ClipboardList,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    });
  }

  if (canReadInventory || tokenMetrics) {
    statCards.push({
      label: 'Stock Alerts',
      value: stockAlertCount,
      icon: AlertTriangle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
    });
  }

  if (canReadInventory || canReadResources) {
    statCards.push({
      label: 'Resource Types',
      value: resourceTypeCount,
      icon: Box,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    });
  }

  const cardCount = Math.max(statCards.length, 1);
  const isLoading =
    (canUseTokenMetrics && metricsLoading) ||
    (canReadPeople && peopleLoading) ||
    (canReadInventory && resourcesLoading) ||
    (canReadExpeditions && expeditionsLoading) ||
    (canReadTransfers && transfersLoading);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tighter uppercase">
            {profile.title}
          </h1>
          <p className="text-zinc-500 font-mono text-[10px] sm:text-xs uppercase pl-1">
            {profile.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/60 px-3 py-1.5 rounded-lg self-start backdrop-blur-sm">
          <ProfileIcon size={16} className={profile.className} />
          <div className="text-[10px] font-mono leading-none">
            <p className="text-zinc-300 font-bold uppercase">{profile.label}</p>
            <p className={profile.className}>{profile.status}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {isLoading
          ? Array.from({ length: cardCount }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.length === 0
            ? [
                <div
                  key="empty-dashboard"
                  className="col-span-full h-32 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest border border-zinc-900 rounded-xl"
                >
                  No dashboard telemetry available for this role.
                </div>,
              ]
            : statCards.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(i < 2 && 'lg:col-span-2', i === 0 && 'md:col-span-2')}
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
                    <div className="p-5 bg-surface-raised brutalist-border rounded-lg hover:border-zinc-700/80 transition-all duration-200 h-full flex flex-col justify-between">
                      <div
                        className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}
                      >
                        <stat.icon size={18} />
                      </div>
                      <div>
                        <p className="text-2xl font-black font-mono tracking-tight">
                          {stat.value ?? 0}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  </BorderGlow>
                </motion.div>
              ))}
      </div>

      <div className="pt-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
          <h3 className="text-xs font-black uppercase tracking-[0.16em] flex items-center gap-2 text-zinc-400">
            <Box size={14} className="text-brand-secondary" />
            Resource Deployment
          </h3>
          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-wider">
            Live Telemetry
          </span>
        </div>

        {!canReadInventory ? (
          <div className="h-40 flex items-center justify-center text-zinc-600 font-mono text-xs uppercase tracking-widest border border-zinc-900 rounded-xl">
            Inventory telemetry unavailable for this role.
          </div>
        ) : resourcesLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-4 bg-surface-raised/30 brutalist-border rounded-xl p-6 min-h-[240px] flex flex-col justify-between">
                <Skeleton className="h-4 w-1/4" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
              <div className="lg:col-span-1 bg-surface-raised/30 brutalist-border rounded-xl p-4 min-h-[240px]">
                <Skeleton className="h-3 w-2/3 mb-3" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-4 bg-surface-raised/30 brutalist-border rounded-xl p-4 min-w-0 min-h-[240px]">
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

              <div className="lg:col-span-1 bg-surface-raised/30 brutalist-border rounded-xl p-4 flex flex-col justify-between min-h-[240px]">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">
                  Stock Status
                </p>
                <div className="flex-1 flex flex-col justify-center">
                  {stockAlertCount === 0 ? (
                    <div className="flex items-center gap-2 text-emerald-500">
                      <CheckCircle size={16} />
                      <span className="text-sm font-bold font-mono">All stocks optimal</span>
                    </div>
                  ) : canReadInventory ? (
                    <div className="space-y-3">
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
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                      <span className="text-xl font-black font-mono text-red-500">
                        {stockAlertCount}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                        ALERTS
                      </span>
                    </div>
                  )}
                </div>
                {canReadInventory && (
                  <button
                    onClick={() => navigate('/inventory')}
                    className="text-[10px] font-black uppercase tracking-wider text-brand-secondary hover:text-amber-400 transition-colors mt-3"
                  >
                    View Details →
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
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
                  <div className="p-4 bg-surface-raised/50 border border-zinc-800 rounded-lg flex flex-col justify-between group h-full hover:border-zinc-700/80 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wide">
                        {res.resource_name}
                      </p>
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          res.status === 'CRITICAL'
                            ? 'bg-red-500 animate-pulse'
                            : res.status === 'LOW'
                              ? 'bg-amber-500 animate-pulse'
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
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase">
                          Est. Durability
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold tabular-nums',
                            (res.projection_days || 0) < 5 ? 'text-red-500' : 'text-zinc-400',
                          )}
                        >
                          {res.projection_days != null ? `${res.projection_days}D` : '—'}
                        </span>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-300',
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
  );
}
