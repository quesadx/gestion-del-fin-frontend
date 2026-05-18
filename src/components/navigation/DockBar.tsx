import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/hooks/useNavItems';

interface DockBarProps {
  items: NavItem[];
  userName?: string;
  onLogout: () => void;
}

export function DockBar({ items, userName, onLogout }: DockBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto mb-4 flex items-center gap-0.5 rounded-none glass-heavy border border-border/30 px-2 py-2 shadow-glass-heavy">
        {items.map((item) => {
          const Icon = item.icon;
          if (!Icon) return null;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center justify-center w-10 h-10 transition-all duration-150',
                  'text-text-muted hover:text-accent-primary',
                  isActive && 'text-accent-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="h-4 w-4 relative z-10" strokeWidth={1.8} />
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-accent-primary shadow-glow" />
                  )}
                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-100 pointer-events-none font-mono-sm text-text-secondary whitespace-nowrap bg-surface-deep border border-border px-2 py-1">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        <span className="w-px h-6 bg-border/30 mx-1.5" />

        {userName && (
          <>
            <div className="flex items-center gap-2 px-2 font-mono-sm text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-status-green shadow-[0_0_6px_#00e676]" />
              <span className="hidden sm:inline tracking-wide">{userName.toUpperCase()}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="font-mono-sm text-text-muted hover:text-status-red transition-colors duration-150 px-2 py-1 border-l border-border/20 ml-1"
            >
              EXIT
            </button>
          </>
        )}
      </div>
    </div>
  );
}
