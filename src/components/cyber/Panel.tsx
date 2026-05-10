import { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  tag?: string;
  status?: string;
  children: ReactNode;
  className?: string;
  accent?: 'cyan' | 'purple';
  variant?: 'default' | 'elevated' | 'flat';
}

export function Panel({
  title,
  tag,
  status,
  children,
  className = '',
  accent = 'cyan',
  variant = 'default',
}: PanelProps) {
  const isCyan = accent === 'cyan';
  const accentClass = isCyan ? 'text-accent-primary' : 'text-accent-secondary';
  const accentBg = isCyan ? 'bg-accent-primary/10' : 'bg-accent-secondary/10';
  const accentBorder = isCyan ? 'border-accent-primary/5' : 'border-accent-secondary/5';
  const variantClass =
    variant === 'elevated'
      ? 'glass-heavy shadow-glass-heavy'
      : variant === 'flat'
        ? 'bg-surface-deep/40 backdrop-blur-light border-border/10'
        : 'glass';

  return (
    <div
      className={`relative rounded-none ${variantClass} ${accentBorder} p-6 transition-all duration-200 ${className}`}
    >
      {/* Corner brackets */}
      <span
        className={`absolute top-0 left-0 w-3 h-3 border-t border-l ${isCyan ? 'border-accent-primary/60' : 'border-accent-secondary/60'}`}
      />
      <span
        className={`absolute bottom-0 right-0 w-3 h-3 border-b border-r ${isCyan ? 'border-accent-primary/60' : 'border-accent-secondary/60'}`}
      />

      {/* Header */}
      {(title || tag || status) && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-border/15">
          <div className="flex items-center gap-3">
            {tag && (
              <span
                className={`font-mono-sm tracking-[0.15em] px-2.5 py-1 ${accentBg} ${accentClass} border ${isCyan ? 'border-accent-primary/20' : 'border-accent-secondary/20'}`}
              >
                {tag}
              </span>
            )}
            {title && (
              <h3 className={`font-sans text-sm font-bold tracking-tight ${accentClass}`}>
                {title}
              </h3>
            )}
          </div>
          {status && (
            <div className={`flex items-center gap-2 font-mono-sm ${accentClass}`}>
              <span
                className={`w-1.5 h-1.5 ${isCyan ? 'bg-accent-primary' : 'bg-accent-secondary'} animate-blink`}
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
