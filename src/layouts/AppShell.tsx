import { useCallback, useState } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROLE_LANDING } from '@/shared/lib/roleGuards';
import { useNavItems } from '@/hooks/useNavItems';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useServerTime } from '@/features/system/hooks/useServerTime';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEmotionalSyncer } from '@/features/ui';
import { Tent, LogOut, Clock } from 'lucide-react';
import Aurora from '@/components/Aurora';
import Dock from '@/components/Dock';

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const role = useAuthStore((state) => state.role);
  const items = useNavItems(role);
  const location = useLocation();
  const { activeCamp, setActiveCamp } = useCampStore();
  const { data: serverTimeData } = useServerTime();
  const [localCampId, setLocalCampId] = useState<number | null>(activeCamp?.id ?? null);
  const isMobile = useIsMobile();

  useEmotionalSyncer({ campId: activeCamp?.id ?? null });

  const { data: camps } = useCamps();
  const campsArray = camps?.data ?? [];

  const handleCampChange = (id: number | null) => {
    setLocalCampId(id);
    if (id) {
      const camp = campsArray.find((c) => c.id === id);
      setActiveCamp(camp ? { id, name: camp.name } : { id });
    } else {
      setActiveCamp(null);
    }
    useAuthStore.getState().updateActivity();
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return key.includes('camps') || key.includes('people') || key.includes('inventory');
      },
    });
    const landing = role ? (ROLE_LANDING[role] ?? '/dashboard') : '/dashboard';
    navigate(landing, { replace: true });
  };

  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [logout, queryClient, navigate]);

  const dockItems = items.map((item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to;
    return {
      icon: Icon ? (
        <Icon
          size={isMobile ? 18 : 22}
          className={`${isActive ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]' : 'text-zinc-400 group-hover:text-zinc-200'}`}
        />
      ) : null,
      label: item.label,
      onClick: () => {
        navigate(item.to);
        useAuthStore.getState().updateActivity();
      },
      className: isActive
        ? 'border-red-500 bg-red-950/40 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
        : 'hover:border-zinc-500 hover:bg-zinc-800/40',
    };
  });

  return (
    <div className="min-h-screen w-screen flex flex-col bg-transparent text-gdf-text-primary relative overflow-hidden select-none">
      {/* 1. Set Up Aurora Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Aurora
          colorStops={['#020202', '#180707', '#020202']}
          amplitude={1.2}
          blend={0.55}
          speed={0.4}
        />
      </div>

      {/* Global scanline and emotional state overlay */}
      <div className="gdf-critical-overlay z-1" />

      {/* Sticky/Fixed top header */}
      <header className="h-16 bg-gdf-surface-raised/30 backdrop-blur-md border-b border-gdf-glass-border flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20">
        {/* Left side: logo and text status */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gdf-accent-primary flex items-center justify-center shrink-0 border border-gdf-border-subtle">
            <span className="font-sans font-black italic text-sm text-gdf-text-inverse">GF</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono font-bold text-gdf-text-primary tracking-wider uppercase leading-none">
              GESTIÓN DEL FIN
            </span>
            <span className="text-[8px] font-mono text-gdf-text-muted uppercase tracking-widest mt-0.5">
              OPERATIONAL SECTOR 04 // ONLINE
            </span>
          </div>
        </div>

        {/* Center side: camp selector */}
        <div className="flex items-center gap-2">
          <label className="text-[9px] font-mono text-gdf-text-muted uppercase tracking-wider hidden sm:flex items-center gap-1.5 shrink-0">
            <Tent size={10} />
            CAMP
          </label>
          <select
            value={localCampId ?? ''}
            onChange={(e) => handleCampChange(e.target.value ? Number(e.target.value) : null)}
            className="bg-gdf-surface-base/40 backdrop-blur-sm border border-gdf-border-subtle text-gdf-text-secondary font-mono text-[11px] py-1 px-2 focus:border-gdf-accent-primary outline-none cursor-pointer rounded uppercase"
          >
            <option value="">ALL CAMPS</option>
            {campsArray.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right side: clocks, user info, system status */}
        <div className="flex items-center gap-4">
          {serverTimeData && (
            <div className="hidden md:flex items-center gap-2 text-[10px] font-mono text-gdf-text-secondary">
              <Clock size={12} className="text-gdf-text-muted" />
              <span>{new Date(serverTimeData.now).toISOString()}</span>
            </div>
          )}

          <div className="flex items-center gap-3 border-l border-gdf-glass-border pl-4">
            <div className="flex flex-col text-right">
              <span className="text-[9.5px] font-mono text-gdf-text-primary font-bold">
                {user?.username?.toUpperCase() || 'USER'}
              </span>
              <span className="text-[8px] font-mono text-gdf-text-muted uppercase">
                {role || 'OPERATOR'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 text-gdf-text-muted hover:text-gdf-status-danger hover:bg-gdf-status-danger/10 border border-transparent hover:border-gdf-status-danger/20 transition-all rounded"
              title="LOGOUT"
            >
              <LogOut size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-gdf-status-success animate-breathe rounded-full" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 relative z-10 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 2. Dock Navigation Integration */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <Dock
          items={dockItems}
          baseItemSize={isMobile ? 38 : 50}
          magnification={isMobile ? 52 : 72}
          distance={isMobile ? 120 : 200}
        />
      </div>
    </div>
  );
}
