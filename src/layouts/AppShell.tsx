import { useCallback, useState } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROLE_LANDING } from '@/shared/lib/roleGuards';
import { useNavItems } from '@/hooks/useNavItems';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useCampStore } from '@/features/camps/store/camp.store';
import { useServerTime } from '@/features/system/hooks/useServerTime';
import { LayoutGrid, Tent, LogOut, Clock, PanelLeftClose, PanelLeft } from 'lucide-react';

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const role = useAuthStore((state) => state.role);
  const items = useNavItems(role);
  const { data: camps } = useCamps();
  const { activeCamp, setActiveCamp } = useCampStore();
  const { data: serverTimeData } = useServerTime();
  const [collapsed, setCollapsed] = useState(false);
  const [localCampId, setLocalCampId] = useState<number | null>(activeCamp?.id ?? null);

  const campsArray = Array.isArray((camps as Record<string, unknown>)?.data)
    ? ((camps as Record<string, unknown>).data as Record<string, unknown>[])
    : [];

  const handleCampChange = (id: number | null) => {
    setLocalCampId(id);
    if (id) {
      const camp = campsArray.find((c: Record<string, unknown>) => (c.id as number) === id);
      setActiveCamp(camp ? { id, name: camp.name as string } : { id });
    } else {
      setActiveCamp(null);
    }
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

  return (
    <div className="flex h-screen bg-surface-base">
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} bg-surface-raised border-r border-zinc-800 flex flex-col transition-all duration-200 shrink-0`}
      >
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary flex items-center justify-center shrink-0">
              <span className="font-sans font-black italic text-sm text-surface-base">GF</span>
            </div>
            {!collapsed && (
              <div className="text-[10px] font-mono text-zinc-400 uppercase leading-tight">
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
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-xs font-mono font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-zinc-800 text-brand-primary border-r-2 border-brand-primary'
                      : 'text-zinc-400 border-r-2 border-transparent hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`
                }
              >
                {Icon && <Icon size={16} />}
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-zinc-800 p-3">
          {!collapsed && (
            <div className="space-y-2">
              <label className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <Tent size={10} />
                ACTIVE CAMP
              </label>
              <select
                value={localCampId ?? ''}
                onChange={(e) => handleCampChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-surface-base border border-zinc-700 text-zinc-300 font-mono text-[11px] py-1.5 px-2 focus:border-brand-primary outline-none"
              >
                <option value="">ALL CAMPS</option>
                {campsArray.map((c: Record<string, unknown>) => (
                  <option key={c.id as number} value={c.id as number}>
                    {c.name as string}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-2">
            <div className="w-6 h-6 bg-zinc-800 flex items-center justify-center shrink-0">
              <span className="font-mono text-[10px] font-bold text-brand-secondary">
                {(user?.username || 'U')[0].toUpperCase()}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-zinc-300 truncate">
                  {user?.username?.toUpperCase() || 'USER'}
                </div>
                <div className="text-[8px] font-mono text-zinc-500 uppercase">
                  {role || 'OPERATOR'}
                </div>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-zinc-600 hover:text-zinc-300 shrink-0"
              title={collapsed ? 'Expand' : 'Collapse'}
            >
              {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
            </button>
          </div>
        </div>

        <div className="p-2 border-t border-zinc-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-mono text-zinc-500 hover:text-brand-primary hover:bg-zinc-800/50 transition-colors uppercase tracking-wider"
          >
            <LogOut size={12} />
            {!collapsed && <span>LOGOUT</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-surface-base/80 backdrop-blur-sm border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <LayoutGrid size={14} className="text-zinc-600" />
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
              OPERATIONAL SECTOR 04 // ONLINE
            </span>
          </div>

          <div className="flex items-center gap-4">
            {serverTimeData && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                <Clock size={12} className="text-zinc-500" />
                <span>{new Date(serverTimeData.now).toISOString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-brand-accent animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-brand-accent uppercase tracking-widest">
                NOMINAL SYSTEM
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
