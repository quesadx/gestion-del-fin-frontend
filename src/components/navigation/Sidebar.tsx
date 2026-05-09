import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/hooks/useNavItems';

interface SidebarProps {
  items: NavItem[];
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export function Sidebar({ items, isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  return (
    <>
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      ) : null}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-lg transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed && 'lg:w-20',
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <div
            className={cn(
              'text-sm font-bold text-glow-fuchsia font-display',
              isCollapsed && 'lg:hidden',
            )}
          >
            GESTION DEL FIN
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden rounded-sm border border-[var(--border)] px-2 py-1 text-[10px] font-tech tracking-widest text-[var(--neon-cyan)] lg:inline-flex"
            >
              {isCollapsed ? 'EXPAND' : 'COLLAPSE'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-[var(--border)] p-1 text-[var(--neon-cyan)] lg:hidden"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-sm px-3 py-2 text-[11px] font-tech tracking-widest transition-colors',
                      isActive
                        ? 'bg-[oklch(0.68_0.32_340_/_0.15)] text-[var(--neon-fuchsia)] shadow-[0_0_12px_var(--neon-fuchsia)]'
                        : 'text-muted-foreground hover:text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.08)]',
                      isCollapsed && 'lg:justify-center',
                    )
                  }
                >
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                  <span className={cn(isCollapsed && 'lg:hidden')}>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>

        <div
          className={cn(
            'border-t border-[var(--border)] px-4 py-4 text-[10px] font-mono-data text-muted-foreground',
            isCollapsed && 'lg:hidden',
          )}
        >
          SYSTEM READY · v1.0.0
        </div>
      </aside>
    </>
  );
}
