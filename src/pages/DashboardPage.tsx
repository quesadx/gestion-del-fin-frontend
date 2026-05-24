import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useServerTime, getServerNow } from '@/features/system/hooks/useServerTime';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { format } from 'date-fns';
import BlurText from '@/components/BlurText';
import CountUp from '@/components/CountUp';

interface ModuleCard {
  label: string;
  to: string;
  metric?: string;
  metricValue?: string | number;
  accent: 'cyan' | 'amber' | 'green';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.role);
  const userName = useAuthStore((state) => state.user?.username);
  const activeCamp = useCampStore((state) => state.activeCamp);

  const {
    isLoading,
    campCount,
    activeCamps,
    resourceCount,
    camps,
    autoDailyCount,
    activeCampName,
    peopleInCamp,
    inventoryItemCount,
    activeExplorationsInCamp,
  } = useDashboardStats(role, activeCamp?.id);

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
    modules.push({ label: 'PEOPLE', to: '/people', accent: 'amber' });
    modules.push({ label: 'ADMISSIONS', to: '/admissions', accent: 'green' });
    modules.push({ label: 'USERS', to: '/users', accent: 'cyan' });
    modules.push({ label: 'PROFESSIONS', to: '/professions', accent: 'amber' });
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
    modules.push({ label: 'AUDIT', to: '/inventory/audit', accent: 'amber' });
  }
  if (role === 'worker') {
    modules.push({ label: 'INVENTORY', to: '/inventory', accent: 'cyan' });
    modules.push({ label: 'RATIONS', to: '/rations', accent: 'amber' });
  }
  if (role === 'travel_coordinator') {
    modules.push({ label: 'EXPEDITIONS', to: '/explorations', accent: 'amber' });
  }

  if (isLoading) return <HoloLoader />;

  return (
    <div className="space-y-8 animate-fade-in">
      <GlassPanel accent="cyan" variant="heavy" className="p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <StatusBadge status="TERMINAL ACTIVE" variant="green" />
              <span className="font-mono-sm tracking-[0.15em] text-gdf-text-muted">
                END MANAGEMENT · COMMAND INTERFACE
              </span>
            </div>
            <h1 className="font-sans text-3xl font-extrabold tracking-tight">
              <BlurText
                text={userName?.toUpperCase() ?? 'OPERATOR'}
                delay={50}
                animateBy="letters"
                direction="top"
                className="text-3xl font-extrabold tracking-tight text-gdf-accent-primary gdf-glow-text"
              />
              <span className="text-gdf-text-muted font-normal ml-3 text-lg">· terminal ready</span>
            </h1>
            <p className="font-mono text-gdf-text-muted max-w-2xl leading-relaxed">
              System operational. All subsystems nominal. Select a module to execute operations.
            </p>
            {activeCampName && (
              <p className="font-mono-sm text-gdf-accent-primary mt-2">
                ACTIVE CAMP: {activeCampName.toUpperCase()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-4 font-mono-sm text-gdf-text-muted">
            <Cpu className="h-3.5 w-3.5 text-gdf-accent-primary" />
            <span className="text-gdf-text-secondary">{serverTime}</span>
          </div>
        </div>
      </GlassPanel>

      {(campCount !== null || resourceCount !== null) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campCount !== null && (
            <GlassPanel accent="cyan" variant="default" className="h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                  Camps
                </span>
                <span className="w-1.5 h-1.5 bg-gdf-accent-primary animate-pulse-glow rounded-full" />
              </div>
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={campCount ?? 0}
                  duration={0.8}
                  className="font-sans text-3xl font-bold text-gdf-accent-primary"
                />
                <span className="font-mono-sm text-gdf-text-muted">total</span>
              </div>
              <div className="mt-2 font-mono-sm text-gdf-text-muted">
                <span className="text-gdf-status-success">{activeCamps} ACTIVE</span>
              </div>
            </GlassPanel>
          )}
          {resourceCount !== null && (
            <GlassPanel accent="cyan" variant="default" className="h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                  Resources
                </span>
                <span className="w-1.5 h-1.5 bg-gdf-accent-primary animate-pulse-glow rounded-full" />
              </div>
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={resourceCount ?? 0}
                  duration={0.8}
                  className="font-sans text-3xl font-bold text-gdf-accent-primary"
                />
                <span className="font-mono-sm text-gdf-text-muted">types</span>
              </div>
            </GlassPanel>
          )}
          <GlassPanel accent="green" variant="default" className="h-full">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                System
              </span>
              <span className="w-1.5 h-1.5 bg-gdf-status-success animate-blink rounded-full" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-sans text-3xl font-bold text-gdf-status-success">ONLINE</span>
              <span className="font-mono-sm text-gdf-text-muted">nominal</span>
            </div>
          </GlassPanel>
          {autoDailyCount !== null && (
            <GlassPanel accent="amber" variant="default" className="h-full">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                  Auto Supply
                </span>
                <span className="w-1.5 h-1.5 bg-gdf-status-warning animate-pulse rounded-full" />
              </div>
              <div className="flex items-baseline gap-2">
                <CountUp
                  to={autoDailyCount ?? 0}
                  duration={0.8}
                  className="font-sans text-3xl font-bold text-gdf-status-warning"
                />
                <span className="font-mono-sm text-gdf-text-muted">active</span>
              </div>
              <div className="mt-2 font-mono-sm text-gdf-text-muted">
                of {resourceCount} resource types
              </div>
            </GlassPanel>
          )}
        </div>
      )}

      {activeCampName &&
        (peopleInCamp !== null ||
          inventoryItemCount !== null ||
          activeExplorationsInCamp !== null) && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {peopleInCamp !== null && (
              <GlassPanel accent="amber" variant="default" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                    People
                  </span>
                  <span className="w-1.5 h-1.5 bg-gdf-status-warning animate-pulse-glow rounded-full" />
                </div>
                <div className="flex items-baseline gap-2">
                  <CountUp
                    to={peopleInCamp ?? 0}
                    duration={0.8}
                    className="font-sans text-3xl font-bold text-gdf-status-warning"
                  />
                  <span className="font-mono-sm text-gdf-text-muted">registered</span>
                </div>
              </GlassPanel>
            )}
            {inventoryItemCount !== null && (
              <GlassPanel accent="green" variant="default" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                    Stock Items
                  </span>
                  <span className="w-1.5 h-1.5 bg-gdf-status-success animate-pulse rounded-full" />
                </div>
                <div className="flex items-baseline gap-2">
                  <CountUp
                    to={inventoryItemCount ?? 0}
                    duration={0.8}
                    className="font-sans text-3xl font-bold text-gdf-status-success"
                  />
                  <span className="font-mono-sm text-gdf-text-muted">in stock</span>
                </div>
              </GlassPanel>
            )}
            {activeExplorationsInCamp !== null && (
              <GlassPanel accent="cyan" variant="default" className="h-full">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono-sm tracking-[0.12em] uppercase text-gdf-text-muted">
                    Explorations
                  </span>
                  <span className="w-1.5 h-1.5 bg-gdf-accent-primary animate-blink rounded-full" />
                </div>
                <div className="flex items-baseline gap-2">
                  <CountUp
                    to={activeExplorationsInCamp ?? 0}
                    duration={0.8}
                    className="font-sans text-3xl font-bold text-gdf-accent-primary"
                  />
                  <span className="font-mono-sm text-gdf-text-muted">ongoing</span>
                </div>
              </GlassPanel>
            )}
          </div>
        )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {modules.map((mod) => (
          <button
            key={mod.to}
            type="button"
            onClick={() => navigate(mod.to)}
            className="group relative gdf-glass-interactive p-5 text-left"
          >
            <div className="flex items-start justify-between mb-3">
              <span
                className={`font-mono-sm tracking-[0.12em] uppercase font-semibold ${
                  mod.accent === 'cyan'
                    ? 'text-gdf-accent-primary'
                    : mod.accent === 'amber'
                      ? 'text-gdf-status-warning'
                      : 'text-gdf-status-success'
                }`}
              >
                {mod.label}
              </span>
              <ArrowUpRight
                className={`h-4 w-4 transition-all duration-200 opacity-0 group-hover:opacity-100 -translate-y-1 translate-x-1 group-hover:translate-y-0 group-hover:translate-x-0 ${
                  mod.accent === 'cyan'
                    ? 'text-gdf-accent-primary'
                    : mod.accent === 'amber'
                      ? 'text-gdf-status-warning'
                      : 'text-gdf-status-success'
                }`}
                strokeWidth={2}
              />
            </div>
            {mod.metric && (
              <div className="space-y-1">
                <span className="font-sans text-2xl font-bold tracking-tight text-gdf-text-primary">
                  {mod.metricValue}
                </span>
                <span className="block font-mono-sm text-gdf-text-muted">{mod.metric}</span>
              </div>
            )}
            {!mod.metric && (
              <span className="font-mono text-gdf-text-muted group-hover:text-gdf-text-secondary transition-colors duration-200">
                Access module <ChevronRight className="inline h-3 w-3 ml-1" />
              </span>
            )}
            <span
              className={`absolute bottom-0 left-0 right-0 h-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                mod.accent === 'cyan'
                  ? 'bg-gdf-accent-primary'
                  : mod.accent === 'amber'
                    ? 'bg-gdf-status-warning'
                    : 'bg-gdf-status-success'
              }`}
            />
          </button>
        ))}
      </div>

      <GlassPanel accent="green" variant="default">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gdf-glass-border">
          <span className="w-1.5 h-1.5 bg-gdf-status-success animate-blink rounded-full" />
          <h3 className="font-sans text-xs font-bold tracking-[0.15em] uppercase text-gdf-accent-primary">
            TACTICAL LOG
          </h3>
          <span className="font-mono-sm text-gdf-text-muted">STREAMING</span>
        </div>
        <div className="space-y-2">
          <div className="font-mono-data text-gdf-text-secondary">
            <span className="text-gdf-text-muted">[00:00]</span>{' '}
            <span className="text-gdf-accent-secondary">OK</span> Terminal boot sequence complete
          </div>
          <div className="font-mono-data text-gdf-text-secondary">
            <span className="text-gdf-text-muted">[00:01]</span>{' '}
            <span className="text-gdf-status-warning">WARN</span> Glass interface v2.0 initialized
          </div>
          {campCount !== null && (
            <div className="font-mono-data text-gdf-text-secondary">
              <span className="text-gdf-text-muted">[00:02]</span>{' '}
              <span className="text-gdf-accent-secondary">OK</span> Camp network: {campCount} nodes
              detected
            </div>
          )}
          {resourceCount !== null && (
            <div className="font-mono-data text-gdf-text-secondary">
              <span className="text-gdf-text-muted">[00:03]</span>{' '}
              <span className="text-gdf-status-success">OK</span> Resource matrix: {resourceCount}{' '}
              types registered
            </div>
          )}
          <div className="font-mono-data text-gdf-text-secondary">
            <span className="text-gdf-text-muted">[00:04]</span>{' '}
            <span className="text-gdf-accent-secondary">OK</span> Security level: ALPHA
          </div>
          <div className="font-mono-data text-gdf-text-secondary">
            <span className="text-gdf-text-muted">[00:05]</span>{' '}
            <span className="text-gdf-status-warning">WARN</span> Awaiting operator input
          </div>
        </div>
        {camps && Array.isArray(camps) && camps.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gdf-glass-border flex flex-wrap gap-2">
            {camps.slice(0, 5).map((camp) => (
              <StatusBadge
                key={camp.id}
                status={camp.name.slice(0, 16)}
                variant={camp.status === 'ACTIVE' ? 'green' : 'red'}
              />
            ))}
            {camps.length > 5 && (
              <span className="font-mono-sm text-gdf-text-muted self-center">
                +{camps.length - 5} more
              </span>
            )}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
