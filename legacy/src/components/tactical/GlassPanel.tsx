import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type AccentColor = 'cyan' | 'amber' | 'green' | 'red';

interface GlassPanelProps {
  title?: string;
  tag?: string;
  status?: string;
  children: ReactNode;
  className?: string;
  accent?: AccentColor;
  variant?: 'default' | 'heavy' | 'subtle';
  bracketed?: boolean;
  depth?: 1 | 2 | 3 | 4 | 5;
}

const ACCENT_CLASSES: Record<
  AccentColor,
  { text: string; bg: string; border: string; dot: string; tagBorder: string }
> = {
  cyan: {
    text: 'text-gdf-accent-secondary',
    bg: 'bg-gdf-accent-secondary/10',
    border: 'border-gdf-accent-secondary/20',
    dot: 'bg-gdf-accent-secondary',
    tagBorder: 'border-gdf-accent-secondary/20',
  },
  amber: {
    text: 'text-gdf-status-warning',
    bg: 'bg-gdf-status-warning/10',
    border: 'border-gdf-status-warning/20',
    dot: 'bg-gdf-status-warning',
    tagBorder: 'border-gdf-status-warning/20',
  },
  green: {
    text: 'text-gdf-status-success',
    bg: 'bg-gdf-status-success/10',
    border: 'border-gdf-status-success/20',
    dot: 'bg-gdf-status-success',
    tagBorder: 'border-gdf-status-success/20',
  },
  red: {
    text: 'text-gdf-status-danger',
    bg: 'bg-gdf-status-danger/10',
    border: 'border-gdf-status-danger/20',
    dot: 'bg-gdf-status-danger',
    tagBorder: 'border-gdf-status-danger/20',
  },
};

const VARIANT_CLASSES: Record<string, string> = {
  default:
    'backdrop-blur-glass bg-gdf-glass-bg border border-gdf-glass-border rounded-lg gdf-depth-2',
  heavy:
    'backdrop-blur-glass-heavy bg-gdf-glass-bg-heavy border border-gdf-glass-border rounded-lg gdf-depth-4',
  subtle:
    'backdrop-blur-glass bg-gdf-glass-bg/40 border border-gdf-glass-border rounded-lg gdf-depth-1',
};

const DEPTH_CLASSES: Record<number, string> = {
  1: 'gdf-depth-1',
  2: 'gdf-depth-2',
  3: 'gdf-depth-3',
  4: 'gdf-depth-4',
  5: 'gdf-depth-5',
};

export function GlassPanel({
  title,
  tag,
  status,
  children,
  className = '',
  accent = 'cyan',
  variant = 'default',
  bracketed = false,
  depth,
}: GlassPanelProps) {
  const a = ACCENT_CLASSES[accent];
  const baseClass = VARIANT_CLASSES[variant];
  const variantClass = depth ? baseClass.replace(/gdf-depth-\d/g, DEPTH_CLASSES[depth]) : baseClass;

  return (
    <div
      className={cn(
        'relative p-6 transition-colors duration-200 gdf-depth-float',
        variantClass,
        a.border,
        bracketed && 'gdf-glass-bracketed',
        className,
      )}
    >
      {(title || tag || status) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-gdf-border-subtle">
          <div className="flex items-center gap-3">
            {tag && (
              <span
                className={cn(
                  'gdf-depth-float',
                  'font-mono-sm tracking-[0.15em] px-2.5 py-1 border rounded-lg gdf-depth-layer animate-float-panel font-bold uppercase',
                  a.bg,
                  a.text,
                  a.tagBorder,
                )}
              >
                {tag}
              </span>
            )}
            {title && (
              <h3 className="font-sans text-sm font-semibold tracking-tight text-gdf-text-primary">
                {title}
              </h3>
            )}
          </div>
          {status && (
            <div className={cn('gdf-depth-float', 'flex items-center gap-2 font-mono-sm', a.text)}>
              <span
                className={cn('gdf-depth-float', 'w-1.5 h-1.5 animate-blink rounded-full', a.dot)}
              />
              {status}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
