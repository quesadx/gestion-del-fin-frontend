import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  fuchsia: 'border-[var(--neon-fuchsia)] text-[var(--neon-fuchsia)] shadow-[0_0_6px_var(--neon-fuchsia)_/_0.3]',
  cyan: 'border-[var(--neon-cyan)] text-[var(--neon-cyan)] shadow-[0_0_6px_var(--neon-cyan)_/_0.3]',
  yellow: 'border-[var(--neon-yellow)] text-[var(--neon-yellow)] shadow-[0_0_6px_var(--neon-yellow)_/_0.3]',
  green: 'border-[#00ff88] text-[#00ff88] shadow-[0_0_6px_#00ff88_/_0.3]',
  red: 'border-[#ff3355] text-[#ff3355] shadow-[0_0_6px_#ff3355_/_0.3]',
};

const DOT_CLASSES: Record<string, string> = {
  fuchsia: 'bg-[var(--neon-fuchsia)] shadow-[0_0_6px_var(--neon-fuchsia)]',
  cyan: 'bg-[var(--neon-cyan)] shadow-[0_0_6px_var(--neon-cyan)]',
  yellow: 'bg-[var(--neon-yellow)] shadow-[0_0_6px_var(--neon-yellow)]',
  green: 'bg-[#00ff88] shadow-[0_0_6px_#00ff88]',
  red: 'bg-[#ff3355] shadow-[0_0_6px_#ff3355]',
};

export interface StatusBadgeProps {
  status: string;
  variant?: 'fuchsia' | 'cyan' | 'yellow' | 'green' | 'red';
  className?: string;
}

export function StatusBadge({ status, variant = 'cyan', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono-data text-[10px] font-bold uppercase tracking-wider',
        STATUS_CLASSES[variant],
        className,
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full animate-pulse-soft',
          DOT_CLASSES[variant],
        )}
      />
      {status}
    </span>
  );
}
