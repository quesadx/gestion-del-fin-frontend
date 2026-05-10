import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  cyan: 'border-accent-primary/30 text-accent-primary',
  purple: 'border-accent-secondary/30 text-accent-secondary',
  green: 'border-[#00e676]/30 text-[#00e676]',
  red: 'border-[#ff3355]/30 text-[#ff3355]',
  yellow: 'border-[#ffab00]/30 text-[#ffab00]',
};

const DOT_CLASSES: Record<string, string> = {
  cyan: 'bg-accent-primary shadow-[0_0_6px_var(--accent-primary)]',
  purple: 'bg-accent-secondary shadow-[0_0_6px_var(--accent-secondary)]',
  green: 'bg-[#00e676] shadow-[0_0_6px_#00e676]',
  red: 'bg-[#ff3355] shadow-[0_0_6px_#ff3355]',
  yellow: 'bg-[#ffab00] shadow-[0_0_6px_#ffab00]',
};

export interface StatusBadgeProps {
  status: string;
  variant?: 'cyan' | 'purple' | 'green' | 'red' | 'yellow';
  className?: string;
}

export function StatusBadge({ status, variant = 'cyan', className = '' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-none border px-2.5 py-0.5 font-mono-sm font-semibold uppercase tracking-[0.1em]',
        'bg-surface-deep/40 backdrop-blur-sm',
        STATUS_CLASSES[variant],
        className,
      )}
    >
      <span className={cn('inline-block h-1.5 w-1.5 animate-blink', DOT_CLASSES[variant])} />
      {status}
    </span>
  );
}
