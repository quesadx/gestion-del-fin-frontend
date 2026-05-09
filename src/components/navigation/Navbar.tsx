import { Menu } from 'lucide-react';
import { GlitchButton } from '@/components/cyber/GlitchButton';

interface NavbarProps {
  userName?: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function Navbar({ userName, onLogout, onToggleSidebar }: NavbarProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)]/30 bg-[oklch(0.1_0.03_320_/_0.6)] backdrop-blur-2xl px-4 py-3 lg:px-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm border border-[var(--border)]/40 p-2 text-[var(--neon-cyan)]/40 hover:text-[var(--neon-cyan)] hover:border-[var(--neon-cyan)]/50 hover:shadow-[0_0_8px_var(--neon-cyan)_/_0.1] transition-all duration-200 lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-2 sm:flex">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--neon-fuchsia)] shadow-[0_0_6px_var(--neon-fuchsia)] animate-pulse-soft" />
          <span className="text-xs tracking-[0.3em] font-display text-glow-fuchsia">
            GESTION DEL FIN
          </span>
        </div>
        <div className="flex items-center sm:hidden">
          <span className="text-xs tracking-[0.3em] font-display text-glow-fuchsia">⚡ GDF</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {userName && (
          <span className="hidden sm:inline-flex items-center text-[10px] font-mono-data text-muted-foreground gap-1.5">
            <span className="text-[var(--neon-cyan)]/50">OPERATOR:</span>
            <span className="text-[var(--neon-cyan)]">{userName.toUpperCase()}</span>
          </span>
        )}
        <GlitchButton
          variant="ghost"
          type="button"
          onClick={onLogout}
          className="rounded-sm text-[10px] px-3 py-1.5"
        >
          DISCONNECT
        </GlitchButton>
      </div>
    </header>
  );
}
