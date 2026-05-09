import { NavLink } from 'react-router-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-[var(--border)] bg-[var(--card)]/30 backdrop-blur-2xl transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed && 'lg:w-20',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
          <div
            className={cn(
              'font-display text-xs tracking-[0.3em] text-glow-fuchsia',
              isCollapsed && 'lg:hidden',
            )}
          >
            GESTION DEL FIN
          </div>
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'rounded-sm border border-[var(--border)] p-1 text-[var(--neon-cyan)]/50 hover:text-[var(--neon-cyan)] hover:border-[var(--neon-cyan)]/50 transition-all duration-150',
              isCollapsed ? 'lg:mx-auto' : 'hidden lg:inline-flex',
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-[var(--border)] p-1 text-[var(--neon-cyan)]/50 hover:text-[var(--neon-cyan)] transition-all duration-150 lg:hidden"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-sm px-3 py-2 text-[11px] font-tech tracking-widest transition-all duration-150',
                        isActive
                          ? 'bg-[oklch(0.68_0.32_340_/_0.12)] text-[var(--neon-fuchsia)]'
                          : 'text-muted-foreground hover:text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.06)]',
                        isCollapsed && 'lg:justify-center lg:px-2',
                      )
                    }
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    <span className={cn(isCollapsed && 'lg:hidden')}>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className={cn('px-4 py-3 border-t border-[var(--border)]', isCollapsed && 'lg:hidden')}>
          <span className="text-[10px] font-mono-data text-muted-foreground/50">
            SYSTEM READY · v1.0.0
          </span>
        </div>
      </aside>
    </>
  );
}
