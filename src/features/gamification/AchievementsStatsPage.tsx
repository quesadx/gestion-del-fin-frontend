import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { AchievementStats } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid } from 'recharts';
import { Trophy, Users, Unlock, Target } from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { useMemo, useRef, useState, useEffect } from 'react';

const CHART_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];

export default function AchievementsStatsPage() {
  const { user } = useAuthStore();
  const canView = hasPermission(user?.permissions, 'metrics.dashboard');

  const { data: stats, isLoading } = useQuery<AchievementStats>({
    queryKey: ['achievements-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/achievements/stats');
      return (res.data?.data ?? res.data) as AchievementStats;
    },
    enabled: canView,
  });

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    const el = chartContainerRef.current;
    if (!el) return;
    const update = () => setChartWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const chartData = useMemo(() => {
    if (!stats?.by_role) return [];
    return Object.entries(stats.by_role).map(([role, data]) => ({
      role: role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      unlocked: data.unlocked,
      total: data.total,
    }));
  }, [stats]);

  const statCards = [
    {
      label: 'Total Achievements',
      value: stats?.total_achievements ?? 0,
      icon: Trophy,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Unlocked Total',
      value: stats?.total_unlocked ?? 0,
      icon: Unlock,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Participants',
      value: stats?.total_users ?? 0,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Roles Tracked',
      value: Object.keys(stats?.by_role ?? {}).length,
      icon: Target,
      color: 'text-brand-primary',
      bg: 'bg-brand-primary/10',
    },
  ];

  if (!canView) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <Target size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Access Restricted</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            You do not have permission to view achievement statistics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
          Achievement Statistics
        </h1>
        <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
          Role-based achievement distribution
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-5 bg-surface-raised brutalist-border rounded-lg space-y-3"
              >
                <div
                  className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon size={18} />
                </div>
                <div>
                  <p className="text-xl font-black font-mono">{stat.value}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {chartData.length > 0 && (
            <div className="bg-surface-raised/40 brutalist-border rounded-xl p-4 sm:p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
                Unlocked by Role
              </h3>
              <div ref={chartContainerRef} className="w-full h-64">
                {chartWidth > 0 && (
                  <BarChart
                    width={Math.max(chartWidth, 200)}
                    height={240}
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1b0b0c" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="role"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#71717a', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{
                        backgroundColor: '#0c0708',
                        border: '1px solid #2a0f10',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="unlocked" radius={[0, 4, 4, 0]} barSize={20}>
                      {chartData.map((_, i) => (
                        <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
