import { Menu } from 'lucide-react';
import { GlitchButton } from '@/components/cyber/GlitchButton';

interface NavbarProps {
  userName?: string;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function Navbar({ userName, onLogout, onToggleSidebar }: NavbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)]/70 px-4 py-3 backdrop-blur-lg lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-sm border border-[var(--border)] p-2 text-[var(--neon-cyan)] lg:hidden"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="space-y-1">
          <div className="text-xs font-display tracking-[0.35em] text-glow-fuchsia">
            GESTION DEL FIN
          </div>
          <div className="text-[10px] font-mono-data text-muted-foreground">
            {userName ? `OPERATOR: ${userName}` : 'OPERATOR: N/A'}
          </div>
        </div>
      </div>
      <GlitchButton variant="warning" type="button" onClick={onLogout} className="rounded-sm">
        LOGOUT
      </GlitchButton>
    </header>
  );
}
