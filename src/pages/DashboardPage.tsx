import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Backpack, Cpu, Activity, Compass, ClipboardCheck } from 'lucide-react';
import { Panel } from '@/components/cyber/Panel';
import { StatCard } from '@/components/cyber/StatCard';
import { TerminalLine } from '@/components/cyber/TerminalLine';
import { CyberGrid } from '@/components/cyber/CyberGrid';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useResources } from '@/features/inventory/hooks/useResources';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCampStore } from '@/features/camps/store/camp.store';
import { getServerNow } from '@/shared/hooks/useServerTime';
import { format } from 'date-fns';
import type { Role } from '@/features/auth/types/auth.types';

function useStats(role: Role | null) {
  const campsQuery = useCamps({
    enabled: role === 'system_admin',
  });
  const resourcesQuery = useResources({
    enabled: role === 'resource_manager',
  });

  const isLoading =
    (role === 'system_admin' && campsQuery.isLoading) ||
    (role === 'resource_manager' && resourcesQuery.isLoading);

  const campCount = role === 'system_admin' ? (campsQuery.data?.length ?? 0) : null;
  const activeCamps =
    role === 'system_admin'
      ? (campsQuery.data?.filter((c: Record<string, unknown>) => c.status === 'ACTIVE').length ?? 0)
      : null;
  const resourceCount = role === 'resource_manager' ? (resourcesQuery.data?.length ?? 0) : null;

  const hasError =
    (role === 'system_admin' && campsQuery.isError) ||
    (role === 'resource_manager' && resourcesQuery.isError);

  const retry = () => {
    if (role === 'system_admin') campsQuery.refetch();
    if (role === 'resource_manager') resourcesQuery.refetch();
  };

  return {
    isLoading,
    campCount,
    activeCamps,
    resourceCount,
    hasError,
    retry,
    camps: campsQuery.data,
    resources: resourcesQuery.data,
  };
}

export function DashboardPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.user?.username);

  const { isLoading, campCount, activeCamps, resourceCount, hasError, retry, camps } =
    useStats(role);

  const [serverTime, setServerTime] = useState<string>('');
  const isSyncing = useCampStore((state) => state.serverTime) > 0;

  useEffect(() => {
    const update = () => {
      const now = isSyncing ? getServerNow() : Date.now();
      setServerTime(format(now, 'HH:mm:ss · dd/MM/yyyy'));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isSyncing]);

  const quickActions: { label: string; to: string; icon: typeof Building2 }[] = [];
  if (role === 'system_admin') {
    quickActions.push({ label: 'MANAGE_CAMPS', to: '/camps', icon: Building2 });
    quickActions.push({ label: 'MANAGE_PEOPLE', to: '/people', icon: ClipboardCheck });
    quickActions.push({ label: 'REVIEW_ADMISSIONS', to: '/admissions', icon: ClipboardCheck });
  }
  if (role === 'resource_manager') {
    quickActions.push({ label: 'MANAGE_RESOURCES', to: '/resources', icon: Backpack });
    quickActions.push({ label: 'VIEW_INVENTORY', to: '/inventory', icon: Building2 });
  }
  if (role === 'worker') {
    quickActions.push({ label: 'VIEW_INVENTORY', to: '/inventory', icon: Backpack });
  }
  if (role === 'travel_coordinator') {
    quickActions.push({ label: 'MANAGE_EXPEDITIONS', to: '/explorations', icon: Compass });
  }

  if (isLoading) return <ScreenLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-sm border border-[var(--neon-fuchsia)]/30 bg-[oklch(0.1_0.03_320_/_0.5)] backdrop-blur-xl">
        <CyberGrid opacity={0.04} />
        <div className="relative z-10 flex flex-col gap-3 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <StatusBadge status="ONLINE" variant="green" />
              <span className="font-mono-data text-[9px] tracking-[0.3em] text-[var(--neon-cyan)]/60">
                PIP-BOY 3000 — SYS.OVERVIEW
              </span>
            </div>
            <h2 className="font-display text-lg font-black tracking-[0.15em] text-glow-fuchsia">
              WELCOME BACK, {userName?.toUpperCase() ?? 'OPERATOR'}
            </h2>
            <p className="font-mono-data text-[11px] text-muted-foreground max-w-2xl">
              System nominal. All subsystems operational. Select a module below or from the sidebar.
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono-data text-[10px] text-[var(--neon-cyan)]">
            <Cpu className="h-3.5 w-3.5" />
            <span>{serverTime}</span>
          </div>
        </div>
      </div>

      {/* Error state */}
      {hasError && (
        <Panel title="DATA_SYNC_ERROR" tag="ERR.02" status="ERROR" accent="fuchsia">
          <p className="font-mono-data text-xs text-red-400/80 mb-3">
            Failed to synchronize with central server. Check network connectivity.
          </p>
          <GlitchButton variant="warning" onClick={retry}>
            RETRY_SYNC
          </GlitchButton>
        </Panel>
      )}

      {/* Stat cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {campCount !== null && (
          <StatCard
            label="TOTAL CAMPS"
            value={campCount}
            icon={Building2}
            accent="fuchsia"
            trend={activeCamps ? { value: `${activeCamps} ACTIVE`, up: true } : null}
          />
        )}
        {resourceCount !== null && (
          <StatCard label="TOTAL RESOURCES" value={resourceCount} icon={Backpack} accent="cyan" />
        )}
        <StatCard
          label="SERVER TIME"
          value={isSyncing ? 'SYNCED' : 'LOCAL'}
          icon={Cpu}
          accent="green"
          trend={{ value: 'REAL-TIME', up: true }}
        />
        <StatCard
          label="SYSTEM LOAD"
          value="NOMINAL"
          icon={Activity}
          accent="yellow"
          trend={{ value: '99.97% UPTIME', up: true }}
        />
      </div>

      {/* Main panels grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="QUICK_ACTIONS" tag="CMD.01" status="READY" accent="cyan">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.to}
                  type="button"
                  onClick={() => navigate(action.to)}
                  className="group flex items-center gap-3 rounded-sm border border-[var(--neon-cyan)]/20 bg-[oklch(0.15_0.05_320_/_0.4)] px-4 py-3 text-left transition-all duration-200 hover:border-[var(--neon-cyan)]/50 hover:bg-[oklch(0.18_0.06_325_/_0.5)] hover:shadow-[0_0_20px_var(--neon-cyan)_/_0.08)]"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[var(--neon-cyan)]/60 transition-colors group-hover:text-[var(--neon-cyan)]" />
                  <span className="font-mono-data text-[11px] tracking-wider text-muted-foreground transition-colors group-hover:text-[var(--neon-cyan)]">
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="SYSLOG" tag="LOG.01" status="STREAMING" accent="cyan">
          <div className="space-y-2 font-mono-data">
            <TerminalLine
              text="BOOT_SEQUENCE COMPLETE — PIP-BOY 3000 v1.0.0"
              delay={0}
              accent="cyan"
            />
            {campCount !== null && (
              <TerminalLine
                text={`CAMP_NETWORK: ${campCount} nodes synchronized`}
                delay={400}
                accent="fuchsia"
              />
            )}
            {resourceCount !== null && (
              <TerminalLine
                text={`RESOURCE_MATRIX: ${resourceCount} types indexed`}
                delay={800}
                accent="cyan"
              />
            )}
            <TerminalLine
              text="SECURITY_LEVEL: ALPHA — All perimeters secured"
              delay={1200}
              accent="yellow"
            />
            <TerminalLine text="AWAITING OPERATOR INPUT..." delay={1600} accent="fuchsia" />
          </div>
          {camps && Array.isArray(camps) && camps.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {camps.slice(0, 4).map((camp: Record<string, unknown>) => (
                <StatusBadge
                  key={camp.id as number}
                  status={(camp.name as string)?.slice(0, 18) ?? ''}
                  variant={camp.status === 'ACTIVE' ? 'green' : 'red'}
                />
              ))}
              {(camps.length as number) > 4 && (
                <span className="font-mono-data text-[10px] text-muted-foreground/60">
                  +{camps.length - 4} more
                </span>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
