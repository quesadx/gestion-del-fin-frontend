import { cn } from '@/lib/utils';
import DecryptedText from '@/components/DecryptedText';

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
        'inline-flex items-center gap-1.5 border px-2.5 py-0.5 font-sans text-[0.6875rem] font-bold uppercase tracking-normal rounded-md',
        'bg-gdf-surface-overlay/50',
        STATUS_CLASSES[variant],
        className,
      )}
    >
      <span
        className={cn('inline-block h-1.5 w-1.5 animate-blink rounded-full', DOT_CLASSES[variant])}
      />
      <DecryptedText
        text={status}
        speed={50}
        maxIterations={8}
        animateOn="view"
        className={cn('font-bold uppercase tracking-normal', STATUS_CLASSES[variant])}
      />
    </span>
  );
}
