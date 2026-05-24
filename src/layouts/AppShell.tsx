import { useCallback, useState } from 'react';
import { useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNavItems } from '@/hooks/useNavItems';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useServerTime } from '@/features/system/hooks/useServerTime';
import { useIsMobile } from '@/hooks/use-mobile';
import { useEmotionalSyncer } from '@/features/ui';
import { LogOut, Clock, Menu, LayoutGrid } from 'lucide-react';
import Aurora from '@/components/Aurora';
import Dock from '@/components/Dock';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const role = useAuthStore((state) => state.role);
  const items = useNavItems(role);
  const location = useLocation();
  const { activeCamp } = useCampStore();
  const { data: serverTimeData } = useServerTime();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEmotionalSyncer({ campId: activeCamp?.id ?? null });

  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [logout, queryClient, navigate]);

  // Sidebar content used in the mobile Sheet
  const sidebarContent = (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gdf-accent-primary flex items-center justify-center shrink-0 rounded-md border border-gdf-border-subtle">
          <span className="font-sans font-black italic text-sm text-gdf-text-inverse">GF</span>
        </div>
        <span className="text-sm font-semibold tracking-normal">GESTIÓN DEL FIN</span>
      </div>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <button
            key={item.to}
            onClick={() => {
              navigate(item.to);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md ${location.pathname === item.to ? 'bg-gdf-accent-primary/20 text-white' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            {item.icon && <item.icon size={18} />}
            <span className="text-sm font-sans text-[0.8125rem]">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const dockItems = items.map((item) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.to;
    return {
      icon: Icon ? (
        <Icon
          size={isMobile ? 18 : 22}
          className={
            isActive
              ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]'
              : 'text-zinc-400 group-hover:text-zinc-200'
          }
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
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      {/* Mobile navigation trigger */}
      {isMobile && (
        <SheetTrigger asChild>
          <button className="p-1.5 text-gdf-text-muted hover:text-gdf-text-secondary" title="Menu">
            <Menu size={18} />
          </button>
        </SheetTrigger>
      )}

      {/* Mobile sidebar sheet */}
      <SheetContent
        side="left"
        className="w-64 p-0 bg-gdf-surface-raised border-r border-gdf-glass-border flex flex-col"
      >
        {sidebarContent}
      </SheetContent>

      <div className="flex h-screen bg-transparent select-none overflow-hidden">
        {/* Aurora background – fixed, z-index 0 */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <Aurora
            colorStops={['#1e293b', '#1e3a5f', '#0f172a']}
            amplitude={0.6}
            blend={0.4}
            speed={0.2}
          />
        </div>

        {/* Main layout */}
        <div className="flex flex-col flex-1 min-w-0 z-10">
          {/* Header */}
          <header className="h-16 bg-gdf-surface-raised/30 backdrop-blur-md border-b border-gdf-glass-border flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20">
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
              <LayoutGrid size={14} className="text-gdf-text-secondary hidden sm:block" />
              <span className="text-xs text-gdf-text-secondary">Gestión del Fin</span>
            </div>
            <div className="flex items-center gap-4">
              {serverTimeData && (
                <div className="hidden md:flex items-center gap-2 text-xs text-gdf-text-secondary">
                  <Clock size={12} className="text-gdf-text-muted" />
                  <span>{new Date(serverTimeData.now).toLocaleTimeString()}</span>
                </div>
              )}
              <div className="flex items-center gap-3 border-l border-gdf-glass-border pl-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs text-gdf-text-primary font-semibold">
                    {user?.username?.toUpperCase() || 'USER'}
                  </span>
                  <span className="text-[10px] text-gdf-text-muted">{role || 'OPERATOR'}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-gdf-text-muted hover:text-gdf-status-danger hover:bg-gdf-status-danger/10 border border-transparent hover:border-gdf-status-danger/20 transition-all rounded"
                  title="LOGOUT"
                >
                  <LogOut size={14} />
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-gdf-status-success animate-breathe rounded-full" />
                </div>
              </div>
            </div>
          </header>

          {/* Main content area with bottom padding for Dock */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 relative">
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

        {/* Dock navigation */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
          <Dock
            items={dockItems}
            baseItemSize={isMobile ? 38 : 50}
            magnification={isMobile ? 52 : 72}
            distance={isMobile ? 120 : 200}
          />
        </div>
      </div>
    </Sheet>
  );
}
