import { ReactNode } from 'react';

type AccentColor = 'cyan' | 'amber' | 'green' | 'red';

interface PanelProps {
  title?: string;
  tag?: string;
  status?: string;
  children: ReactNode;
  className?: string;
  accent?: AccentColor;
  variant?: 'default' | 'elevated' | 'flat';
}

const ACCENT_CLASSES: Record<
  AccentColor,
  {
    text: string;
    bg: string;
    border: string;
    corner: string;
    tagBorder: string;
    dot: string;
  }
> = {
  cyan: {
    text: 'text-accent-primary',
    bg: 'bg-accent-primary/10',
    border: 'border-accent-primary/5',
    corner: 'border-accent-primary/60',
    tagBorder: 'border-accent-primary/20',
    dot: 'bg-accent-primary',
  },
  red: {
    text: 'text-accent-primary',
    bg: 'bg-accent-primary/10',
    border: 'border-accent-primary/5',
    corner: 'border-accent-primary/60',
    tagBorder: 'border-accent-primary/20',
    dot: 'bg-accent-primary',
  },
  amber: {
    text: 'text-accent-secondary',
    bg: 'bg-accent-secondary/10',
    border: 'border-accent-secondary/5',
    corner: 'border-accent-secondary/60',
    tagBorder: 'border-accent-secondary/20',
    dot: 'bg-accent-secondary',
  },
  green: {
    text: 'text-accent-success',
    bg: 'bg-accent-success/10',
    border: 'border-accent-success/5',
    corner: 'border-accent-success/60',
    tagBorder: 'border-accent-success/20',
    dot: 'bg-accent-success',
  },
};

export function Panel({
  title,
  tag,
  status,
  children,
  className = '',
  accent = 'cyan',
  variant = 'default',
}: PanelProps) {
  const a = ACCENT_CLASSES[accent];
  const variantClass =
    variant === 'elevated'
      ? 'glass-heavy shadow-glass-heavy'
      : variant === 'flat'
        ? 'bg-surface-deep/40 backdrop-blur-light border-border/10'
        : 'glass';

  return (
    <div
      className={`relative rounded-none ${variantClass} ${a.border} p-6 transition-all duration-200 ${className}`}
    >
      <span className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${a.corner}`} />
      <span className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${a.corner}`} />

      {(title || tag || status) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-border/15">
          <div className="flex items-center gap-3">
            {tag && (
              <span
                className={`font-mono-sm tracking-[0.15em] px-2.5 py-1 ${a.bg} ${a.text} border ${a.tagBorder}`}
              >
                {tag}
              </span>
            )}
            {title && (
              <h3 className={`font-sans text-sm font-bold tracking-tight ${a.text}`}>{title}</h3>
            )}
          </div>
          {status && (
            <div className={`flex items-center gap-2 font-mono-sm ${a.text}`}>
              <span className={`w-1.5 h-1.5 ${a.dot} animate-blink`} />
              {status}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
