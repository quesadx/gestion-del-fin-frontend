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
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useAuthStore, useCampStore, useConnectionStore } from '../store';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useQuery } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../lib/api';
import { Camp, InventoryItem, Resource } from '../types';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useCallback } from 'react';
import { useServerTime } from '../hooks/useServerTime';
import { can, PERM, usePermissions } from '../lib/permissions';
import { motion, AnimatePresence } from 'motion/react';
import Dock, { type DockItemData } from '../components/navigation/Dock';
import { ShieldAlert } from 'lucide-react';
import { CardBody, CardContainer } from '../components/ui/3d-card';
import DarkVeil from '../components/backgrounds/DarkVeil';
import FloatingLines from '../components/backgrounds/FloatingLines';
import CardSwap, { Card } from '../components/ui/CardSwap';
import StarBorder from '../components/ui/StarBorder';

const PANEL_SHELL =
  'mx-4 mt-2 overflow-hidden rounded-2xl border border-red-500/25 bg-[rgba(78,32,36,0.8)] backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.28),0_0_0_1px_rgba(239,68,68,0.12),0_0_24px_rgba(239,68,68,0.12)]';

const ALERT_ROW = 'relative flex items-center justify-between gap-4 px-5 py-2.5 sm:px-6';

const CAMP_COLOR_THEMES = [
  {
    hueShift: -6,
    border: 'rgba(239,68,68,0.42)',
    tint: 'from-red-500/22 via-red-900/15 to-amber-700/16',
  },
  {
    hueShift: 22,
    border: 'rgba(249,115,22,0.42)',
    tint: 'from-orange-500/24 via-amber-900/16 to-rose-700/15',
  },
  {
    hueShift: 58,
    border: 'rgba(234,179,8,0.42)',
    tint: 'from-yellow-400/20 via-amber-900/14 to-orange-700/16',
  },
  {
    hueShift: 138,
    border: 'rgba(34,197,94,0.42)',
    tint: 'from-emerald-500/24 via-green-900/14 to-teal-700/14',
  },
  {
    hueShift: 214,
    border: 'rgba(14,165,233,0.42)',
    tint: 'from-sky-500/24 via-cyan-900/16 to-blue-700/15',
  },
  {
    hueShift: 292,
    border: 'rgba(244,114,182,0.42)',
    tint: 'from-pink-500/22 via-fuchsia-900/15 to-rose-800/14',
  },
];

const CAMP_FLOATING_LINES_THEMES = [
  {
    key: 'crimson',
    linesGradient: ['#f87171', '#fb7185', '#fdba74', '#f97316'],
    glow: 'rgba(248, 113, 113, 0.26)',
    mist: 'rgba(251, 191, 36, 0.16)',
  },
  {
    key: 'ember',
    linesGradient: ['#fb923c', '#f97316', '#fbbf24', '#fdba74'],
    glow: 'rgba(251, 146, 60, 0.24)',
    mist: 'rgba(251, 191, 36, 0.16)',
  },
  {
    key: 'sun',
    linesGradient: ['#fde047', '#facc15', '#fb923c', '#f97316'],
    glow: 'rgba(250, 204, 21, 0.24)',
    mist: 'rgba(251, 146, 60, 0.16)',
  },
  {
    key: 'forest',
    linesGradient: ['#4ade80', '#22c55e', '#14b8a6', '#86efac'],
    glow: 'rgba(34, 197, 94, 0.24)',
    mist: 'rgba(20, 184, 166, 0.16)',
  },
  {
    key: 'sky',
    linesGradient: ['#38bdf8', '#60a5fa', '#818cf8', '#a78bfa'],
    glow: 'rgba(56, 189, 248, 0.24)',
    mist: 'rgba(129, 140, 248, 0.16)',
  },
  {
    key: 'rose',
    linesGradient: ['#f472b6', '#ec4899', '#fb7185', '#fda4af'],
    glow: 'rgba(244, 114, 182, 0.24)',
    mist: 'rgba(251, 113, 133, 0.16)',
  },
];

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
  '/dashboard': 'metrics.dashboard',
  '/population': 'people.read',
  '/inventory': 'inventory.read',
  '/rations': 'inventory.read',
  '/admission': 'admission.read',
  '/expeditions': 'expeditions.read',
  '/transfers': 'transfers.read',
  '/camps': 'camps.read',
  '/resources': 'resources.*',
  '/professions': 'professions.read',
  '/users': 'users.read',
  '/roles': 'roles.read',
  '/permissions': 'permissions.read',
};

const DOCK_SHELL = 'dock-outer flex items-end shadow-[0_0_40px_rgba(0,0,0,0.35)]';

function DockSkeleton() {
  return (
    <div className={DOCK_SHELL} style={{ height: 68 }}>
      <div
        className="dock-panel flex items-center justify-center gap-3 px-4"
        style={{ height: 68 }}
      >
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="w-[50px] h-[50px] rounded-2xl bg-zinc-800/60 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const { loaded: permsLoaded } = usePermissions();
  const { currentCampId, setCurrentCamp } = useCampStore();
  const { status } = useConnectionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { timeStr, synced } = useServerTime();
  const [campPopupOpen, setCampPopupOpen] = useState(false);
  const [campSwapTick, setCampSwapTick] = useState(0);
  const [campSwapDirection, setCampSwapDirection] = useState<1 | -1>(1);
  const [focusedCampIndex, setFocusedCampIndex] = useState(0);
  const cardHoveredRef = useRef(false);

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
    enabled: !!currentCampId && can(PERM.INVENTORY_READ),
    refetchInterval: 30_000,
  });

  // Session-only dismiss for the alert banner.
  const [alertDismissed, setAlertDismissed] = useState(false);

  const campCards = useMemo(() => {
    if (!camps || camps.length === 0) return [];
    if (!currentCampId) return camps;

    const currentCampIndex = camps.findIndex((camp) => camp.id === currentCampId);
    if (currentCampIndex < 0) return camps;

    const currentCamp = camps[currentCampIndex];
    const rest = camps.filter((camp) => camp.id !== currentCampId);
    return [currentCamp, ...rest];
  }, [camps, currentCampId]);

  const activeFloatingLinesTheme = useMemo(() => {
    return (
      CAMP_FLOATING_LINES_THEMES[focusedCampIndex % CAMP_FLOATING_LINES_THEMES.length] ??
      CAMP_FLOATING_LINES_THEMES[0]
    );
  }, [focusedCampIndex]);

  // Auto-select the user's home camp on first load, validate it exists in camps list.
  const confirmCampSelection = useCallback(
    (campId: number) => {
      setCurrentCamp(campId);
      navigate('/dashboard', { replace: true });
      setCampPopupOpen(false);
    },
    [navigate, setCurrentCamp],
  );

  const shiftCampCards = useCallback(
    (direction: 1 | -1) => {
      if (!camps || camps.length <= 1) return;
      setCampSwapDirection(direction);
      setCampSwapTick((prev) => prev + 1);
    },
    [camps],
  );

  const openCampPopup = () => {
    if (camps && camps.length > 0) {
      setFocusedCampIndex(0);
    }
    setCampPopupOpen(true);
  };

  const confirmCampFromIndex = useCallback(
    (campIndex: number) => {
      const camp = campCards[campIndex];
      if (!camp) return;
      confirmCampSelection(camp.id);
    },
    [campCards, confirmCampSelection],
  );

  const handleSwapFinish = useCallback((frontCardIndex: number) => {
    setFocusedCampIndex(frontCardIndex);
  }, []);

  const handleCardHoverChange = useCallback((hovered: boolean) => {
    cardHoveredRef.current = hovered;
  }, []);

  useEffect(() => {
    if (!campPopupOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!campCards || campCards.length === 0) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        setCampPopupOpen(false);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (!cardHoveredRef.current) {
          shiftCampCards(-1);
        }
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (!cardHoveredRef.current) {
          shiftCampCards(1);
        }
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        confirmCampFromIndex(focusedCampIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [campPopupOpen, campCards, focusedCampIndex, confirmCampFromIndex, shiftCampCards]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibleNavItems = permsLoaded
    ? NAV_ITEMS.filter((item) => can(NAV_PERMISSIONS[item.to]))
    : [];

  const permsLoading = !permsLoaded;

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
      <CardContainer
        className="w-full"
        containerClassName="mx-4 mt-4 shrink-0 relative z-50 overflow-visible"
        tiltStrength={1200}
        tiltXStrength={1600}
        tiltYStrength={1200}
      >
        <CardBody className="relative z-50 h-16 w-full overflow-visible rounded-3xl border border-red-500/15 bg-[rgba(37,23,26,0.78)] px-5 sm:px-6 shadow-[0_18px_70px_rgba(0,0,0,0.24),0_0_0_1px_rgba(239,68,68,0.05)] backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.12),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.06),transparent_35%)]" />

          <div className="relative z-10 flex h-full items-center justify-between gap-4">
            {/* Branding */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl flex items-center justify-center text-brand-primary shadow-[0_0_14px_rgba(239,68,68,0.16)] select-none">
                <ShieldAlert size={17} />
              </div>
              <div className="leading-none">
                <p className="font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-brand-primary leading-none">
                  GESTION-DEL-FIN
                </p>
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.18em] mt-0.5 block">
                  Survival Terminal v1.0.0 // MANAGEMENT INTERFACE
                </span>
              </div>
            </div>

            {/* Camp switcher - left of center */}
            <div className="relative flex items-center">
              <StarBorder
                as="button"
                onClick={openCampPopup}
                className="group cursor-pointer hover:scale-[1.02] hover:brightness-110 transition-all duration-200 [&_.inner-content]:!py-0 [&_.inner-content]:!px-0 [&_.inner-content]:!bg-transparent [&_.inner-content]:!border-none [&_.inner-content]:!text-inherit [&_.inner-content]:!text-xs [&_.inner-content]:!rounded-full"
                color="rgba(239,68,68,0.85)"
                speed="5s"
                thickness={2}
              >
                <div className="flex items-center gap-3 px-4 py-1.5">
                  <Tent className="text-brand-secondary shrink-0" size={18} />
                  <span className="truncate text-zinc-200 text-sm font-bold font-mono uppercase tracking-[0.16em]">
                    {camps?.find((c) => c.id === currentCampId)?.name ?? 'Select Refuge'}
                  </span>
                </div>
              </StarBorder>
            </div>

            {/* Right: server time + connection status + user chip */}
            <div className="flex items-center gap-3.5">
              {/* Server time */}
              {synced && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 tabular-nums">
                  <Clock size={13} className="text-zinc-500" />
                  {timeStr}
                </span>
              )}

              {/* User chip */}
              <div className="flex items-center gap-2 bg-[rgba(37,23,26,0.92)] border border-red-500/12 rounded px-2.5 py-1 shadow-[0_0_0_1px_rgba(239,68,68,0.04)]">
                <div className="w-6 h-6 rounded bg-zinc-700 grid place-items-center text-[11px] font-black text-brand-secondary select-none">
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
          </div>
        </CardBody>
      </CardContainer>

      {/* ── Disconnected banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {campPopupOpen && (
          <motion.div
            key="camp-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setCampPopupOpen(false)}
            className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm"
          >
            <div className="pointer-events-none fixed inset-0 z-0 h-[100dvh] w-[100dvw]">
              <FloatingLines
                linesGradient={activeFloatingLinesTheme.linesGradient}
                enabledWaves={['top', 'middle', 'bottom']}
                lineCount={[10, 14, 18]}
                lineDistance={[8, 6, 4]}
                bendRadius={4.8}
                bendStrength={-0.35}
                interactive={false}
                parallax={true}
                parallaxStrength={0.08}
                animationSpeed={0.9}
                mixBlendMode="screen"
              />
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    `radial-gradient(circle at 50% 35%, ${activeFloatingLinesTheme.glow}, transparent 56%),` +
                    `radial-gradient(circle at 16% 78%, ${activeFloatingLinesTheme.mist}, transparent 32%),` +
                    'linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.44))',
                }}
              />
            </div>

            <div className="relative z-10 flex h-full w-full items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[96vw]"
              >
                <div className="pointer-events-none absolute inset-x-0 -top-18 z-40 flex items-start justify-center">
                  <div className="pointer-events-auto flex w-full max-w-5xl items-center justify-between rounded-full border border-white/10 bg-black/25 px-5 py-2.5 backdrop-blur-xl shadow-[0_0_45px_rgba(0,0,0,0.35)]">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-300">
                        Refuge selector
                      </p>
                      <h3 className="text-sm font-black uppercase tracking-[0.08em] text-white">
                        Choose camp
                      </h3>
                    </div>
                    <button
                      onClick={() => setCampPopupOpen(false)}
                      className="text-zinc-400 hover:text-zinc-100 transition-colors text-xs font-bold uppercase tracking-[0.18em]"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {camps && camps.length > 0 ? (
                  <div className="relative z-10 mt-6 flex h-[78vh] min-h-[560px] w-full items-center justify-center overflow-hidden rounded-[2rem]">
                    {camps.length > 1 ? (
                      <>
                        <button
                          type="button"
                          onClick={() => shiftCampCards(-1)}
                          aria-label="Show previous camp"
                          className="absolute left-8 top-1/2 z-50 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-6 text-zinc-200 backdrop-blur-md transition-colors hover:border-white/35 hover:text-white"
                        >
                          <ChevronLeft size={30} />
                        </button>

                        <button
                          type="button"
                          onClick={() => shiftCampCards(1)}
                          aria-label="Show next camp"
                          className="absolute right-8 top-1/2 z-50 -translate-y-1/2 rounded-full border border-white/20 bg-black/35 p-6 text-zinc-200 backdrop-blur-md transition-colors hover:border-white/35 hover:text-white"
                        >
                          <ChevronRight size={30} />
                        </button>
                      </>
                    ) : null}

                    <CardSwap
                      width={820}
                      height={500}
                      cardDistance={120}
                      verticalDistance={62}
                      delay={5600}
                      autoPlay={false}
                      pauseOnHover={true}
                      manualSwapTick={campSwapTick}
                      manualSwapDirection={campSwapDirection}
                      bringToFrontOnClick={false}
                      onCardClick={confirmCampFromIndex}
                      onSwapFinish={handleSwapFinish}
                      onHoverChange={handleCardHoverChange}
                      skewAmount={2}
                      easing="linear"
                    >
                      {campCards.map((camp, index) => {
                        const theme = CAMP_COLOR_THEMES[index % CAMP_COLOR_THEMES.length];
                        const isActive = camp.id === currentCampId;

                        return (
                          <Card key={camp.id}>
                            <div
                              className="relative h-full w-full cursor-pointer overflow-hidden rounded-[14px] text-left transition-transform duration-200 ease-out hover:z-50 hover:-translate-y-4"
                              style={{ border: `1px solid ${theme.border}` }}
                            >
                              <div className="absolute inset-0">
                                <DarkVeil
                                  hueShift={theme.hueShift}
                                  speed={0.82}
                                  warpAmount={1.5}
                                  noiseIntensity={0.02}
                                  resolutionScale={1}
                                />
                              </div>

                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${theme.tint} mix-blend-screen`}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

                              <div className="relative z-10 flex h-full flex-col justify-start p-8">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2">
                                    <span className="inline-flex rounded-full border border-white/25 bg-black/30 px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em] text-zinc-200">
                                      Refuge
                                    </span>

                                    {isActive ? (
                                      <span className="inline-flex rounded-full border border-red-500/45 bg-red-500/14 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-[0.14em] text-red-200">
                                        Active
                                      </span>
                                    ) : null}

                                    <p className="text-sm font-mono uppercase tracking-[0.16em] text-zinc-300/85">
                                      Select destination
                                    </p>

                                    <h4 className="text-4xl font-black uppercase tracking-tight text-white">
                                      {camp.name}
                                    </h4>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </CardSwap>
                  </div>
                ) : (
                  <div className="rounded-xl border border-red-500/12 bg-black/20 px-4 py-6 text-center text-xs font-mono uppercase tracking-[0.14em] text-zinc-400">
                    No camps available
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}

        {status === 'disconnected' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0"
          >
            <div className={PANEL_SHELL}>
              <div className={`${ALERT_ROW} border-l-2 border-red-500/60`}>
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
          can(PERM.INVENTORY_READ) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0"
            >
              {inventoryAlerts.criticalCount > 0 ? (
                <div className={PANEL_SHELL}>
                  <div className={`${ALERT_ROW} border-l-2 border-red-500/60`}>
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
                </div>
              ) : (
                <div className="mx-4 mt-2 overflow-hidden rounded-2xl border border-amber-500/12 bg-[rgba(37,23,26,0.94)] backdrop-blur-md shadow-[0_20px_60px_rgba(0,0,0,0.26),0_0_0_1px_rgba(245,158,11,0.04)]">
                  <div className={`${ALERT_ROW} border-l-2 border-amber-500/60`}>
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
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {permsLoading ? <DockSkeleton /> : <Dock items={dockItems} />}
        </motion.div>
      </div>
    </div>
  );
}
