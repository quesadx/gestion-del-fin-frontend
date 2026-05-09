import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'fuchsia' | 'cyan' | 'yellow' | 'green';
  trend?: { value: string; up: boolean } | null;
  className?: string;
}

const accentMap = {
  fuchsia: {
    border: 'border-[var(--neon-fuchsia)]/30 hover:border-[var(--neon-fuchsia)]/60',
    glow: 'shadow-[0_0_20px_var(--neon-fuchsia)_/_0.08] hover:shadow-[0_0_30px_var(--neon-fuchsia)_/_0.15]',
    text: 'text-[var(--neon-fuchsia)]',
    bg: 'bg-[var(--neon-fuchsia)]/10',
  },
  cyan: {
    border: 'border-[var(--neon-cyan)]/30 hover:border-[var(--neon-cyan)]/60',
    glow: 'shadow-[0_0_20px_var(--neon-cyan)_/_0.08] hover:shadow-[0_0_30px_var(--neon-cyan)_/_0.15]',
    text: 'text-[var(--neon-cyan)]',
    bg: 'bg-[var(--neon-cyan)]/10',
  },
  yellow: {
    border: 'border-[var(--neon-yellow)]/30 hover:border-[var(--neon-yellow)]/60',
    glow: 'shadow-[0_0_20px_var(--neon-yellow)_/_0.08] hover:shadow-[0_0_30px_var(--neon-yellow)_/_0.15]',
    text: 'text-[var(--neon-yellow)]',
    bg: 'bg-[var(--neon-yellow)]/10',
  },
  green: {
    border: 'border-[#00ff88]/30 hover:border-[#00ff88]/60',
    glow: 'shadow-[0_0_20px_#00ff88_/_0.08] hover:shadow-[0_0_30px_#00ff88_/_0.15]',
    text: 'text-[#00ff88]',
    bg: 'bg-[#00ff88]/10',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'fuchsia',
  trend = null,
  className = '',
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className={cn(
        'relative rounded-sm border bg-[oklch(0.12_0.03_320_/_0.6)] backdrop-blur-xl p-4 transition-all duration-300',
        colors.border,
        colors.glow,
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="block font-mono-data text-[10px] tracking-[0.2em] text-muted-foreground">
            {label}
          </span>
          <span
            className={cn('block font-display text-2xl font-bold tracking-wider', colors.text)}
            style={{ textShadow: `0 0 12px currentColor` }}
          >
            {value}
          </span>
          {trend && (
            <span className="inline-flex items-center gap-1 font-mono-data text-[10px] text-muted-foreground">
              {trend.up ? (
                <TrendingUp className="h-3 w-3 text-[#00ff88]" />
              ) : (
                <TrendingDown className="h-3 w-3 text-[#ff3355]" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        <div className={cn('p-2 rounded-sm', colors.bg)}>
          <Icon className={cn('h-5 w-5', colors.text)} />
        </div>
      </div>

      {/* Corner accents */}
      <span
        className="absolute top-0 left-0 h-2 w-2 border-t border-l opacity-30"
        style={{ borderColor: `var(--neon-${accent === 'green' ? 'cyan' : accent})` }}
      />
      <span
        className="absolute bottom-0 right-0 h-2 w-2 border-b border-r opacity-30"
        style={{ borderColor: `var(--neon-${accent === 'green' ? 'cyan' : accent})` }}
      />
    </div>
  );
}
