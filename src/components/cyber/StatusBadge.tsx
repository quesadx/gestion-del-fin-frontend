import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  cyan: 'border-red-500/30 text-red-400',
  purple: 'border-amber-500/30 text-amber-400',
  green: 'border-emerald-500/30 text-emerald-400',
  red: 'border-red-500/30 text-red-400',
  yellow: 'border-amber-500/30 text-amber-400',
};

const DOT_CLASSES: Record<string, string> = {
  cyan: 'bg-red-500',
  purple: 'bg-amber-500',
  green: 'bg-emerald-500',
  red: 'bg-red-500',
  yellow: 'bg-amber-500',
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
        'inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono-sm font-bold uppercase tracking-[0.1em]',
        'bg-zinc-900/50',
        STATUS_CLASSES[variant],
        className,
      )}
    >
      <span className={cn('inline-block h-1.5 w-1.5 animate-blink', DOT_CLASSES[variant])} />
      {status}
    </span>
  );
}
