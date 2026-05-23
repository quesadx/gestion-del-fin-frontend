import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LayoutGrid, Tent, LogOut, Clock, PanelLeftClose, PanelLeft, Menu } from 'lucide-react';

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const role = useAuthStore((state) => state.role);
  const items = useNavItems(role);
  const { data: camps } = useCamps();
  const location = useLocation();
  const { activeCamp, setActiveCamp } = useCampStore();
  const { data: serverTimeData } = useServerTime();
  const [collapsed, setCollapsed] = useState(false);
  const [localCampId, setLocalCampId] = useState<number | null>(activeCamp?.id ?? null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const showLabels = isMobile || !collapsed;

  useEmotionalSyncer({ campId: activeCamp?.id ?? null });

  const campsArray = camps?.data ?? [];

  const handleCampChange = (id: number | null) => {
    setLocalCampId(id);
    if (id) {
      const camp = campsArray.find((c) => c.id === id);
      setActiveCamp(camp ? { id, name: camp.name } : { id });
    } else {
      setActiveCamp(null);
    }
    setMobileOpen(false);
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

  const sidebarContent = (
    <>
      <div className="px-4 py-5 border-b border-gdf-glass-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gdf-accent-primary flex items-center justify-center shrink-0">
            <span className="font-sans font-black italic text-sm text-gdf-text-inverse">GF</span>
          </div>
          {showLabels && (
            <div className="text-[10px] font-mono text-gdf-text-muted uppercase leading-tight">
              <div>END TIMES</div>
              <div>MGMT</div>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? 'bg-gdf-surface-hover text-gdf-accent-primary border-r-2 border-gdf-accent-secondary'
                    : 'text-gdf-text-muted border-r-2 border-transparent hover:text-gdf-text-secondary hover:bg-gdf-surface-hover/50'
                }`
              }
            >
              {Icon && <Icon size={16} />}
              {showLabels && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-gdf-glass-border p-3">
        {showLabels && (
          <div className="space-y-2">
            <label className="text-[9px] font-mono text-gdf-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Tent size={10} />
              ACTIVE CAMP
            </label>
            <select
              value={localCampId ?? ''}
              onChange={(e) => handleCampChange(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-gdf-surface-base border border-gdf-border-subtle text-gdf-text-secondary font-mono text-[11px] py-1.5 px-2 focus:border-gdf-accent-primary outline-none"
            >
              <option value="">ALL CAMPS</option>
              {campsArray.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-gdf-glass-border flex items-center gap-2">
          <div className="w-6 h-6 bg-gdf-surface-hover flex items-center justify-center shrink-0">
            <span className="font-mono text-[10px] font-bold text-gdf-accent-secondary">
              {(user?.username || 'U')[0].toUpperCase()}
            </span>
          </div>
          {showLabels && (
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-gdf-text-primary truncate">
                {user?.username?.toUpperCase() || 'USER'}
              </div>
              <div className="text-[8px] font-mono text-gdf-text-muted uppercase">
                {role || 'OPERATOR'}
              </div>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-gdf-text-muted hover:text-gdf-text-secondary shrink-0"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            </button>
          )}
        </div>
      </div>

      <div className="p-2 border-t border-gdf-glass-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-mono text-gdf-text-muted hover:text-gdf-status-danger hover:bg-gdf-surface-hover/50 transition-colors uppercase tracking-wider"
        >
          <LogOut size={12} />
          {showLabels && <span>LOGOUT</span>}
        </button>
      </div>
    </>
  );

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="flex h-screen bg-transparent">
        {!isMobile && (
          <aside
            className={`${collapsed ? 'w-16' : 'w-64'} bg-gdf-surface-raised backdrop-blur-glass border-r border-gdf-glass-border flex flex-col transition-all duration-200 shrink-0`}
          >
            {sidebarContent}
          </aside>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 bg-gdf-glass-bg-heavy backdrop-blur-glass-heavy border-b border-gdf-glass-border flex items-center justify-between px-4 md:px-6 shrink-0">
            <div className="flex items-center gap-3">
              {isMobile && (
                <SheetTrigger asChild>
                  <button
                    className="p-1.5 text-gdf-text-muted hover:text-gdf-text-secondary"
                    title="Menu"
                  >
                    <Menu size={18} />
                  </button>
                </SheetTrigger>
              )}
              <LayoutGrid size={14} className="text-gdf-text-muted hidden sm:block" />
              <span className="text-[9px] font-mono text-gdf-text-muted uppercase tracking-widest">
                OPERATIONAL SECTOR 04 // ONLINE
              </span>
            </div>

            <div className="flex items-center gap-4">
              {serverTimeData && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-gdf-text-secondary">
                  <Clock size={12} className="text-gdf-text-muted" />
                  <span>{new Date(serverTimeData.now).toISOString()}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-gdf-status-success animate-breathe rounded-full" />
                <span className="text-[9px] font-mono font-bold text-gdf-status-success uppercase tracking-widest">
                  SYSTEM NOMINAL
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
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
        </div>
      </div>
      <SheetContent
        side="left"
        className="w-64 p-0 bg-gdf-surface-raised border-r border-gdf-glass-border flex flex-col"
      >
        {sidebarContent}
      </SheetContent>
    </Sheet>
  );
}
