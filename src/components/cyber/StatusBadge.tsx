import { cn } from '@/lib/utils';

const STATUS_CLASSES: Record<string, string> = {
  red: 'border-gdf-status-danger/30 text-gdf-status-danger',
  amber: 'border-gdf-status-warning/30 text-gdf-status-warning',
  green: 'border-gdf-status-success/30 text-gdf-status-success',
};

const DOT_CLASSES: Record<string, string> = {
  red: 'bg-gdf-status-danger',
  amber: 'bg-gdf-status-warning',
  green: 'bg-gdf-status-success',
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
        'inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-mono-sm font-bold uppercase tracking-[0.1em] rounded-md',
        'bg-gdf-surface-overlay/50',
        STATUS_CLASSES[variant],
        className,
      )}
    >
      <span
        className={cn('inline-block h-1.5 w-1.5 animate-blink rounded-full', DOT_CLASSES[variant])}
      />
      {status}
    </span>
  );
}
