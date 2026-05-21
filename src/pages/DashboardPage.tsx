import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useServerTime, getServerNow } from '@/features/system/hooks/useServerTime';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { TerminalLine } from '@/components/cyber/TerminalLine';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { format } from 'date-fns';

interface ModuleCard {
  label: string;
  to: string;
  metric?: string;
  metricValue?: string | number;
  accent: 'cyan' | 'purple' | 'green';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.user?.username);

  const { isLoading, campCount, activeCamps, resourceCount, camps, autoDailyCount } =
    useDashboardStats(role);

  const [serverTime, setServerTime] = useState<string>('');
  const { data: timeData } = useServerTime();
  const isSyncing = !!timeData;

  useEffect(() => {
    const update = () => {
      const now = isSyncing ? getServerNow() : Date.now();
      setServerTime(format(now, 'HH:mm:ss · dd/MM/yyyy'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  const modules: ModuleCard[] = [];
  if (role === 'system_admin') {
    modules.push({
      label: 'CAMPS',
      to: '/camps',
      metric: 'Active / Total',
      metricValue: `${activeCamps ?? 0} / ${campCount ?? 0}`,
      accent: 'cyan',
    });
    modules.push({ label: 'PEOPLE', to: '/people', accent: 'purple' });
    modules.push({ label: 'ADMISSIONS', to: '/admissions', accent: 'green' });
    modules.push({ label: 'USERS', to: '/users', accent: 'cyan' });
    modules.push({ label: 'PROFESSIONS', to: '/professions', accent: 'purple' });
    modules.push({ label: 'EXPLORATIONS', to: '/explorations', accent: 'green' });
  }
  if (role === 'resource_manager') {
    modules.push({
      label: 'RESOURCES',
      to: '/resources',
      metric: 'Types',
      metricValue: resourceCount ?? 0,
      accent: 'cyan',
    });
    modules.push({ label: 'INVENTORY', to: '/inventory', accent: 'green' });
    modules.push({ label: 'AUDIT', to: '/inventory/audit', accent: 'purple' });
  }
  if (role === 'worker') {
    modules.push({ label: 'INVENTORY', to: '/inventory', accent: 'cyan' });
    modules.push({ label: 'RATIONS', to: '/rations', accent: 'purple' });
  }
  if (role === 'travel_coordinator') {
    modules.push({ label: 'EXPEDITIONS', to: '/explorations', accent: 'purple' });
  }

  if (isLoading) return <ScreenLoader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="relative overflow-hidden rounded-none glass-heavy border border-border/20 p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.28_210/0.08),transparent_60%)]" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status="TERMINAL ACTIVE" variant="green" />
              <span className="font-mono-sm tracking-[0.15em] text-text-muted">
                END MANAGEMENT · COMMAND INTERFACE
              </span>
            </div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight">
              <span
                className="text-accent-primary"
                style={{ textShadow: '0 0 24px var(--accent-primary)' }}
              >
                {userName?.toUpperCase() ?? 'OPERATOR'}
              </span>
              <span className="text-text-muted font-normal ml-3 text-lg">· terminal ready</span>
            </h1>
            <p className="font-mono text-text-muted max-w-2xl leading-relaxed">
              System operational. All subsystems nominal. Select a module to execute operations.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono-sm text-text-muted">
            <Cpu className="h-3.5 w-3.5 text-accent-primary" />
            <span className="text-text-secondary">{serverTime}</span>
          </div>
        </div>
      </div>

      {(campCount !== null || resourceCount !== null) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campCount !== null && (
            <div className="glass p-5 rounded-none border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-sm tracking-[0.12em] uppercase text-text-muted">
                  Camps
                </span>
                <span className="w-1.5 h-1.5 bg-accent-primary animate-pulse-glow" />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-sans text-3xl font-bold text-accent-primary"
                  style={{ textShadow: '0 0 16px var(--accent-primary)' }}
                >
                  {campCount}
                </span>
                <span className="font-mono-sm text-text-muted">total</span>
              </div>
              <div className="mt-2 font-mono-sm text-text-muted">
                <span className="text-status-green">{activeCamps} ACTIVE</span>
              </div>
            </div>
          )}
          {resourceCount !== null && (
            <div className="glass p-5 rounded-none border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-sm tracking-[0.12em] uppercase text-text-muted">
                  Resources
                </span>
                <span className="w-1.5 h-1.5 bg-accent-primary animate-pulse-glow" />
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className="font-sans text-3xl font-bold text-accent-primary"
                  style={{ textShadow: '0 0 16px var(--accent-primary)' }}
                >
                  {resourceCount}
                </span>
                <span className="font-mono-sm text-text-muted">types</span>
              </div>
            </div>
          )}
          <div className="glass p-5 rounded-none border border-border/20">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-sm tracking-[0.12em] uppercase text-text-muted">
                System
              </span>
              <span className="w-1.5 h-1.5 bg-status-green animate-blink" />
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className="font-sans text-3xl font-bold text-status-green"
                style={{ textShadow: '0 0 16px #00e676' }}
              >
                ONLINE
              </span>
              <span className="font-mono-sm text-text-muted">nominal</span>
            </div>
          </div>
          {autoDailyCount !== null && (
            <div className="glass p-5 rounded-none border border-border/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-sm tracking-[0.12em] uppercase text-text-muted">
                  Auto Supply
                </span>
                <span className="w-1.5 h-1.5 bg-accent-secondary animate-pulse" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-sans text-3xl font-bold text-accent-secondary">
                  {autoDailyCount}
                </span>
                <span className="font-mono-sm text-text-muted">active</span>
              </div>
              <div className="mt-2 font-mono-sm text-text-muted">
                of {resourceCount} resource types
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((mod) => (
          <button
            key={mod.to}
            type="button"
            onClick={() => navigate(mod.to)}
            className="group relative glass-interactive rounded-none p-5 text-left transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className={`font-mono-sm tracking-[0.12em] uppercase font-semibold ${mod.accent === 'cyan' ? 'text-accent-primary' : mod.accent === 'purple' ? 'text-accent-secondary' : 'text-status-green'}`}
              >
                {mod.label}
              </span>
              <ArrowUpRight
                className={`h-4 w-4 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 ${mod.accent === 'cyan' ? 'text-accent-primary' : mod.accent === 'purple' ? 'text-accent-secondary' : 'text-status-green'}`}
                strokeWidth={2}
              />
            </div>
            {mod.metric && (
              <div className="space-y-1">
                <span className="font-sans text-2xl font-bold tracking-tight text-text-primary">
                  {mod.metricValue}
                </span>
                <span className="block font-mono-sm text-text-muted">{mod.metric}</span>
              </div>
            )}
            {!mod.metric && (
              <span className="font-mono text-text-muted group-hover:text-text-secondary transition-colors duration-200">
                Access module <ChevronRight className="inline h-3 w-3 ml-1" />
              </span>
            )}
            <span
              className={`absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${mod.accent === 'cyan' ? 'bg-accent-primary' : mod.accent === 'purple' ? 'bg-accent-secondary' : 'bg-status-green'}`}
            />
          </button>
        ))}
      </div>

      <div className="glass rounded-none border border-border/20 p-6">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border/10">
          <span className="w-1.5 h-1.5 bg-status-green animate-blink" />
          <h3 className="font-sans text-xs font-bold tracking-[0.15em] uppercase text-accent-primary">
            SYSLOG
          </h3>
          <span className="font-mono-sm text-text-muted">STREAMING</span>
        </div>
        <div className="space-y-2">
          <TerminalLine text="TERMINAL BOOT SEQUENCE COMPLETE" delay={0} accent="cyan" />
          <TerminalLine text="GLASS INTERFACE v2.0 INITIALIZED" delay={300} accent="purple" />
          {campCount !== null && (
            <TerminalLine
              text={`CAMP NETWORK: ${campCount} nodes detected`}
              delay={600}
              accent="cyan"
            />
          )}
          {resourceCount !== null && (
            <TerminalLine
              text={`RESOURCE MATRIX: ${resourceCount} types registered`}
              delay={900}
              accent="green"
            />
          )}
          <TerminalLine
            text="SECURITY LEVEL: ALPHA — Encryption active"
            delay={1200}
            accent="cyan"
          />
          <TerminalLine text="AWAITING OPERATOR INPUT" delay={1500} accent="purple" />
        </div>
        {camps && Array.isArray(camps) && camps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border/10 flex flex-wrap gap-2">
            {(camps as Record<string, unknown>[]).slice(0, 5).map((camp) => (
              <StatusBadge
                key={(camp.id as number | string) ?? ''}
                status={(camp.name as string)?.slice(0, 16) ?? ''}
                variant={camp.status === 'ACTIVE' ? 'green' : 'red'}
              />
            ))}
            {camps.length > 5 && (
              <span className="font-mono-sm text-text-muted self-center">
                +{camps.length - 5} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
