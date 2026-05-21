import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  red: 'border-red-500/30 text-red-400',
  amber: 'border-amber-500/30 text-amber-400',
  green: 'border-emerald-500/30 text-emerald-400',
};

const DOT_CLASSES: Record<string, string> = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-emerald-500',
};

export interface StatusBadgeProps {
  status: string;
  variant?: 'red' | 'amber' | 'green';
  className?: string;
}

export function StatusBadge({ status, variant = 'red', className = '' }: StatusBadgeProps) {
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
