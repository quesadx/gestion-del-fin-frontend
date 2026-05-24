import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Box,
  ClipboardCheck,
  Map,
  LogOut,
  Tent,
  ArrowLeftRight,
  Package,
  Sandwich,
  Wrench,
  Shield,
} from 'lucide-react';
import { useAuthStore, useCampStore, useConnectionStore } from '../store';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../lib/api';
import { Camp, InventoryItem, Resource } from '../types';
import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';
import { useServerTime } from '../hooks/useServerTime';
import { can } from '../lib/permissions';
import { motion, AnimatePresence } from 'motion/react';

// ── Connection badge config ───────────────────────────────────────────────────

const CONNECTION_BADGE = {
  checking: {
    wrapper: 'bg-amber-950/20 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400 animate-pulse',
    label: () => 'CONNECTING...',
  },
  connected: {
    wrapper: 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400',
    label: (latencyMs: number | null) => (latencyMs != null ? `ONLINE · ${latencyMs}ms` : 'ONLINE'),
  },
  disconnected: {
    wrapper: 'bg-red-950/20 text-red-400 border-red-500/30',
    dot: 'bg-red-400 animate-pulse',
    label: () => 'SERVER UNREACHABLE',
  },
} as const;

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/population', icon: Users, label: 'Population' },
  { to: '/inventory', icon: Box, label: 'Inventory' },
  { to: '/rations', icon: Sandwich, label: 'Rations' },
  { to: '/admission', icon: ClipboardCheck, label: 'Admissions' },
  { to: '/expeditions', icon: Map, label: 'Expeditions' },
  { to: '/transfers', icon: ArrowLeftRight, label: 'Transfers' },
  { to: '/camps', icon: Tent, label: 'Refuges' },
  { to: '/resources', icon: Package, label: 'Resources' },
  { to: '/professions', icon: Wrench, label: 'Professions' },
  { to: '/users', icon: Shield, label: 'Users' },
] as const;

// Permission required to see each nav item
const NAV_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'dashboard.read',
  '/population': 'people.read',
  '/inventory': 'inventory.read',
  '/rations': 'inventory.read',
  '/admission': 'admissions.read',
  '/expeditions': 'expeditions.read',
  '/transfers': 'transfers.read',
  '/camps': 'camps.read',
  '/resources': 'resources.*',
  '/professions': 'professions.read',
  '/users': 'users.read',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { currentCampId, setCurrentCamp } = useCampStore();
  const { status, latencyMs } = useConnectionStore();
  const navigate = useNavigate();
  const { timeStr, synced } = useServerTime();

  // Start the ping loop and get the manual retry trigger.
  const { retry } = useConnectionStatus();

  const { data: camps } = useQuery<Camp[]>({
    queryKey: ['camps'],
    queryFn: async () => {
      const res = await apiClient.get('/camps');
      return unwrapList<Camp>(res.data);
    },
  });

  // ── Inventory alerts (shared query key — reused by nav dot) ─────────
  const { data: inventoryAlerts } = useQuery({
    queryKey: ['inventory-alerts', currentCampId],
    queryFn: async () => {
      const [invRes, resRes] = await Promise.all([
        apiClient.get(`/inventory/${currentCampId}`),
        apiClient.get('/resources'),
      ]);
      const items: InventoryItem[] = unwrapList<InventoryItem>(invRes.data);
      const resourceTypes: Resource[] = unwrapList<Resource>(resRes.data);

      const criticalNames: string[] = [];
      let lowCount = 0;

      items.forEach((item) => {
        const rt = resourceTypes.find((r) => r.id === item.resource_type_id);
        const qty = item.quantity ?? 0;
        const minStock = rt?.minimum_stock ?? 0;
        const name = rt?.name ?? `Resource #${item.resource_type_id}`;

        if (qty < minStock / 2) {
          criticalNames.push(name);
        } else if (qty < minStock) {
          lowCount++;
        }
      });

      return { criticalCount: criticalNames.length, criticalNames, lowCount };
    },
    enabled: !!currentCampId && can(user?.role, 'inventory.read'),
    refetchInterval: 30_000,
  });

  // Session-only dismiss for the alert banner.
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Auto-select the user's home camp on first load.
  useEffect(() => {
    if (user?.camp_id && !currentCampId) {
      setCurrentCamp(user.camp_id);
    }
  }, [user, currentCampId, setCurrentCamp]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const badge = CONNECTION_BADGE[status];

  const visibleNavItems = NAV_ITEMS.filter((item) => can(user?.role, NAV_PERMISSIONS[item.to]));

  return (
    <div className="flex flex-col h-screen bg-surface-base text-zinc-100 overflow-hidden">
      {/* ── Top header ──────────────────────────────────────────────────── */}
      <header className="h-16 shrink-0 border-b border-zinc-900 bg-surface-raised/85 backdrop-blur-md flex items-center justify-between px-6 sm:px-8 sticky top-0 z-40">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center font-black text-black italic text-sm shadow-[0_0_15px_rgba(239,68,68,0.25)] select-none">
            GF
          </div>
          <div className="leading-none">
            <p className="font-black text-sm uppercase tracking-tighter text-brand-primary leading-none">
              Gestion del Fin
            </p>
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 block">
              Tactical Command Sector // Active
            </span>
          </div>
        </div>

        {/* Camp switcher - left of center */}
        <div className="flex items-center gap-2 bg-zinc-950/40 border border-zinc-900 rounded-full px-4 py-1.5 max-w-50 sm:max-w-xs md:max-w-sm">
          <Tent className="text-brand-secondary shrink-0" size={13} />
          <div className="relative flex-1">
            <select
              value={currentCampId ?? ''}
              onChange={(e) => {
                setCurrentCamp(Number(e.target.value));
                navigate('/dashboard', { replace: true });
              }}
              className="w-full bg-transparent border-none text-zinc-300 text-xs font-bold font-mono uppercase tracking-tight focus:outline-none appearance-none cursor-pointer pr-4"
            >
              {!currentCampId && (
                <option value="" className="bg-zinc-950">
                  Select Refuge
                </option>
              )}
              {camps?.map((camp) => (
                <option key={camp.id} value={camp.id} className="bg-zinc-950 text-zinc-300">
                  {camp.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: server time + connection status + user chip */}
        <div className="flex items-center gap-3.5">
          {/* Server time */}
          {synced && (
            <div className="hidden md:flex items-center gap-2 bg-zinc-950/40 border border-zinc-900 rounded px-3 py-1.5">
              <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
                SVRT
              </span>
              <span className="text-[11px] font-mono font-bold text-zinc-300 tabular-nums">
                {timeStr}
              </span>
            </div>
          )}

          {/* Live connection badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider border transition-colors duration-500',
              badge.wrapper,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', badge.dot)} />
            {status === 'connected'
              ? badge.label(latencyMs)
              : (badge as { label: () => string }).label()}
          </div>

          {/* User chip */}
          <div className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 rounded px-2.5 py-1">
            <div className="w-5.5 h-5.5 rounded bg-zinc-800 grid place-items-center text-[10px] font-black text-brand-secondary select-none">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="hidden md:block text-left leading-none">
              <span className="text-[10px] font-bold block">{user?.username}</span>
              <span className="text-[8px] text-zinc-500 font-mono uppercase tracking-tight mt-0.5 block">
                {user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Terminate Session"
              className="p-1 ml-1 text-zinc-500 hover:text-brand-primary border border-transparent hover:border-zinc-800 rounded transition-colors"
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Disconnected banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {status === 'disconnected' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="bg-red-950/60 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                <p className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-wider">
                  Server unreachable — data may be stale. Retrying every 5s.
                </p>
              </div>
              <button
                onClick={retry}
                className="shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Retry Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stock alert banner ──────────────────────────────────────────── */}
      <AnimatePresence>
        {currentCampId &&
          !alertDismissed &&
          inventoryAlerts &&
          (inventoryAlerts.criticalCount > 0 || inventoryAlerts.lowCount > 0) &&
          can(user?.role, 'inventory.read') && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 overflow-hidden"
            >
              {inventoryAlerts.criticalCount > 0 ? (
                <div className="bg-red-950/60 border-b border-red-500/30 px-6 py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    <p className="text-[11px] font-mono font-bold text-red-400 uppercase tracking-wider truncate">
                      CRITICAL STOCK: {inventoryAlerts.criticalNames.join(', ')}
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertDismissed(true)}
                    className="shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div className="bg-amber-950/60 border-b border-amber-500/30 px-6 py-2.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                    <p className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      LOW STOCK: {inventoryAlerts.lowCount} resource
                      {inventoryAlerts.lowCount !== 1 ? 's' : ''} below minimum
                    </p>
                  </div>
                  <button
                    onClick={() => setAlertDismissed(true)}
                    className="shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </motion.div>
          )}
      </AnimatePresence>

      {/* ── Page content ────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto bg-surface-base px-6 py-6 sm:px-8 sm:py-8 pb-32">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>

      {/* ── Bottom navigation dock ───────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <motion.nav
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 bg-zinc-950/85 backdrop-blur-xl border border-zinc-900 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.85)] max-w-[95vw]"
        >
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-3 py-2 rounded-full text-xs font-mono font-semibold transition-all select-none border border-transparent',
                  isActive
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary font-bold shadow-[0_0_12px_rgba(239,68,68,0.15)] scale-102'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50',
                )
              }
            >
              <item.icon size={15} />
              <span className="hidden md:inline tracking-tight uppercase text-[10px]">
                {item.label}
              </span>
            </NavLink>
          ))}
        </motion.nav>
      </div>
    </div>
  );
}
