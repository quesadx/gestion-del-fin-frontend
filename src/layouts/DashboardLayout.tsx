import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  Lock,
  Key,
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
import Dock, { type DockItemData } from '../components/navigation/Dock';
import { ShieldAlert } from 'lucide-react';

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
  { to: '/roles', icon: Lock, label: 'Roles' },
  { to: '/permissions', icon: Key, label: 'Permissions' },
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
  '/roles': 'roles.read',
  '/permissions': 'permissions.read',
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { currentCampId, setCurrentCamp } = useCampStore();
  const { status, latencyMs } = useConnectionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { timeStr, synced } = useServerTime();
  const [campPopupOpen, setCampPopupOpen] = useState(false);

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
        const minStock = Number(rt?.minimum_stock ?? 0);
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

  // Auto-select the user's home camp on first load, validate it exists in camps list.
  useEffect(() => {
    if (!camps || camps.length === 0) return;
    const campIds = new Set(camps.map((c) => c.id));

    // If currentCampId is invalid, clear it so we can auto-select a valid one.
    if (currentCampId && !campIds.has(currentCampId)) {
      setCurrentCamp(null);
      return;
    }

    // Auto-select user's home camp if none selected yet and it's valid.
    if (!currentCampId && user?.camp_id && campIds.has(user.camp_id)) {
      setCurrentCamp(user.camp_id);
    }
  }, [camps, currentCampId, user, setCurrentCamp]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const badge = CONNECTION_BADGE[status];

  const visibleNavItems = NAV_ITEMS.filter((item) => can(user?.role, NAV_PERMISSIONS[item.to]));

  const dockItems: DockItemData[] = visibleNavItems.map((item) => {
    const isActive = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
    const showInventoryAlert =
      item.to === '/inventory' && (inventoryAlerts?.criticalCount ?? 0) > 0;

    return {
      icon: (
        <div className="relative">
          <item.icon size={15} />
          {showInventoryAlert && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
          )}
        </div>
      ),
      label: item.label,
      onClick: () => navigate(item.to),
      className: isActive
        ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary shadow-[0_0_12px_rgba(239,68,68,0.18)]'
        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/70',
    };
  });

  return (
    <div className="relative z-10 flex flex-col h-screen bg-transparent text-zinc-100 overflow-hidden">
      {/* ── Top header ──────────────────────────────────────────────────── */}
      <header className="h-16 shrink-0 border border-red-500/12 bg-[rgba(12,10,14,0.94)] backdrop-blur-md flex items-center justify-between px-5 sm:px-6 rounded-2xl mx-4 mt-4 sticky top-0 z-40 shadow-[0_20px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(239,68,68,0.04)]">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary shadow-[0_0_15px_rgba(239,68,68,0.25)] select-none">
            <ShieldAlert size={17} />
          </div>
          <div className="leading-none">
            <p className="font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-brand-primary leading-none">
              GESTION DEL FIN
            </p>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mt-0.5 block">
              Survival Terminal v1.0.0 // MANAGEMENT INTERFACE
            </span>
          </div>
        </div>

        {/* Camp switcher - left of center */}
        <div className="relative">
          <button
            onClick={() => setCampPopupOpen(true)}
            className="flex items-center gap-2 bg-[rgba(18,15,23,0.96)] border border-red-500/10 rounded-full px-4 py-1.5 max-w-50 sm:max-w-xs md:max-w-sm shadow-[0_0_0_1px_rgba(239,68,68,0.03)] cursor-pointer hover:border-red-500/25 transition-colors"
          >
            <Tent className="text-brand-secondary shrink-0" size={14} />
            <span className="truncate text-zinc-300 text-xs font-bold font-mono uppercase tracking-[0.14em]">
              {camps?.find((c) => c.id === currentCampId)?.name ?? 'Select Refuge'}
            </span>
          </button>

          <AnimatePresence>
            {campPopupOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  onClick={() => setCampPopupOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  className="absolute left-0 top-full mt-2 z-50 w-56 bg-[#1b0b0c] border border-red-500/15 rounded-xl overflow-hidden shadow-xl shadow-black/60"
                >
                  <div className="py-1">
                    {camps?.map((camp) => (
                      <button
                        key={camp.id}
                        onClick={() => {
                          setCurrentCamp(camp.id);
                          navigate('/dashboard', { replace: true });
                          setCampPopupOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-[0.12em] transition-colors hover:bg-red-950/40 ${
                          camp.id === currentCampId
                            ? 'text-brand-primary bg-red-950/20'
                            : 'text-zinc-300'
                        }`}
                      >
                        {camp.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Right: server time + connection status + user chip */}
        <div className="flex items-center gap-3.5">
          {/* Server time */}
          {synced && (
            <div className="hidden md:flex items-center gap-2 bg-[rgba(18,15,23,0.96)] border border-red-500/10 rounded px-3 py-1.5 shadow-[0_0_0_1px_rgba(239,68,68,0.03)]">
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.14em]">
                SVRT
              </span>
              <span className="text-xs font-mono font-bold text-zinc-200 tabular-nums">
                {timeStr}
              </span>
            </div>
          )}

          {/* Live connection badge */}
          <div
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-mono font-bold uppercase tracking-[0.14em] border transition-colors duration-500',
              badge.wrapper,
            )}
          >
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', badge.dot)} />
            {status === 'connected'
              ? badge.label(latencyMs)
              : (badge as { label: () => string }).label()}
          </div>

          {/* User chip */}
          <div className="flex items-center gap-2 bg-[rgba(18,15,23,0.96)] border border-red-500/10 rounded px-2.5 py-1 shadow-[0_0_0_1px_rgba(239,68,68,0.03)]">
            <div className="w-6 h-6 rounded bg-zinc-800 grid place-items-center text-[11px] font-black text-brand-secondary select-none">
              {user?.username?.[0].toUpperCase()}
            </div>
            <div className="hidden md:block text-left leading-none">
              <span className="text-xs font-bold block">{user?.username}</span>
              <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.1em] mt-0.5 block">
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
      <main className="flex-1 overflow-y-auto bg-transparent px-6 py-6 sm:px-8 sm:py-8 pb-32">
        <div className="max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ── Bottom navigation dock ───────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Dock items={dockItems} />
        </motion.div>
      </div>
    </div>
  );
}