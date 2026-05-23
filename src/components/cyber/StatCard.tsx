import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'cyan' | 'amber' | 'green' | 'red';
  trend?: { value: string; up: boolean } | null;
  className?: string;
}

const accentMap = {
  cyan: {
    text: 'text-accent-primary',
    bg: 'bg-accent-primary/8',
    border: 'border-accent-primary/15',
  },
  amber: {
    text: 'text-accent-secondary',
    bg: 'bg-accent-secondary/8',
    border: 'border-accent-secondary/15',
  },
  green: {
    text: 'text-status-green',
    bg: 'bg-[#00e676]/8',
    border: 'border-[#00e676]/15',
  },
  red: {
    text: 'text-status-red',
    bg: 'bg-[#ff3355]/8',
    border: 'border-[#ff3355]/15',
  },
};

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'cyan',
  trend = null,
  className = '',
}: StatCardProps) {
  const colors = accentMap[accent];

  return (
    <div
      className={cn(
        'relative rounded-none glass p-5 transition-all duration-200 hover:border-border/40 hover:shadow-glass-heavy group',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <span className="block font-mono-sm tracking-[0.12em] text-text-muted uppercase">
            {label}
          </span>
          <span
            className={cn('block font-sans text-2xl font-bold tracking-tight', colors.text)}
            style={{ textShadow: `0 0 16px currentColor` }}
          >
            {value}
          </span>
          {trend && (
            <span className="inline-flex items-center gap-1.5 font-mono-sm text-text-muted">
              {trend.up ? (
                <TrendingUp className="h-3 w-3 text-status-green" />
              ) : (
                <TrendingDown className="h-3 w-3 text-status-red" />
              )}
              {trend.value}
            </span>
          )}
        </div>
        <div className={cn('p-2.5 rounded-none', colors.bg, colors.border, 'border')}>
          <Icon className={cn('h-5 w-5', colors.text)} strokeWidth={1.8} />
        </div>
      </div>

      <span
        className={`absolute bottom-0 right-0 w-6 h-[1px] ${colors.text.replace('text', 'bg')}/30`}
      />
    </div>
  );
}
