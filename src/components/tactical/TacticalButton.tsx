import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TacticalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'warning' | 'danger';
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-gdf-accent-primary text-gdf-text-inverse hover:bg-gdf-accent-primary-dim active:scale-[0.98]',
  warning: 'bg-gdf-status-warning text-gdf-text-inverse hover:brightness-110 active:scale-[0.98]',
  ghost:
    'bg-transparent border border-gdf-border-default text-gdf-text-secondary hover:border-gdf-accent-primary hover:text-gdf-accent-primary',
  danger:
    'bg-transparent border border-gdf-status-danger/30 text-gdf-status-danger hover:bg-gdf-status-danger/10 hover:border-gdf-status-danger',
};

export function TacticalButton({
  children,
  variant = 'primary',
  className = '',
  ...rest
}: TacticalButtonProps) {
  return (
    <button
      className={cn(
        'font-mono text-xs tracking-wider uppercase px-5 py-2.5 rounded-md transition-all duration-150 gdf-btn-press disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
