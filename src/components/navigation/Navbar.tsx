import { Menu } from 'lucide-react';
import { GlitchButton } from '@/components/cyber/GlitchButton';

interface NavbarProps {
  userName?: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function Navbar({ userName, onLogout, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/10 backdrop-blur-xl px-4 py-3 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm border border-[var(--border)] p-2 text-[var(--neon-cyan)]/50 hover:text-[var(--neon-cyan)] hover:border-[var(--neon-cyan)]/50 transition-all duration-150 lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="text-xs tracking-[0.3em] font-display text-glow-fuchsia">
          GESTION DEL FIN
        </div>
      </div>

      <div className="flex items-center gap-4">
        {userName && (
          <span className="hidden sm:inline text-[10px] font-mono-data text-muted-foreground">
            <span className="text-[var(--neon-cyan)]/60">OPERATOR:</span> {userName}
          </span>
        )}
        <GlitchButton
          variant="warning"
          type="button"
          onClick={onLogout}
          className="rounded-sm text-[10px] px-3 py-1.5"
        >
          LOGOUT
        </GlitchButton>
      </div>
    </header>
  );
}
