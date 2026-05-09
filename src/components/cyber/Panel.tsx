import { ReactNode } from 'react';

interface PanelProps {
  title?: string;
  tag?: string;
  status?: string;
  children: ReactNode;
  className?: string;
  accent?: 'fuchsia' | 'cyan';
}

export function Panel({
  title,
  tag,
  status,
  children,
  className = '',
  accent = 'fuchsia',
}: PanelProps) {
  const accentBorder =
    accent === 'fuchsia'
      ? 'border-[var(--neon-fuchsia)] shadow-[0_0_8px_var(--neon-fuchsia)]'
      : 'border-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]';
  const accentBg = accent === 'fuchsia' ? 'bg-[var(--neon-fuchsia)]' : 'bg-[var(--neon-cyan)]';
  const statusColor =
    accent === 'fuchsia' ? 'text-[var(--neon-fuchsia)]' : 'text-[var(--neon-cyan)]';
  const statusDot =
    accent === 'fuchsia'
      ? 'bg-[var(--neon-fuchsia)] shadow-[0_0_8px_var(--neon-fuchsia)]'
      : 'bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]';

  return (
    <div
      className={`relative rounded-lg border border-[oklch(0.68_0.32_340_/_0.18)] bg-[oklch(0.1_0.03_320_/_0.5)] p-5 shadow-[0_0_40px_rgba(0,0,0,0.15)] ${className}`}
    >
      <span className={`absolute top-0 left-0 h-3 w-3 border-t-2 border-l-2 ${accentBorder}`} />
      <span className={`absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 ${accentBorder}`} />

      {(title || tag) && (
        <div className="flex items-center justify-between gap-3 border-b pb-4 mb-4 border-[oklch(0.68_0.32_340_/_0.3)]">
          <div className="flex flex-wrap items-center gap-3">
            {tag && (
              <span
                className={`font-mono-data text-[10px] px-2 py-0.5 clip-tag rounded-sm ${accentBg} text-[var(--charcoal)]`}
              >
                {tag}
              </span>
            )}
            {title && (
              <h3 className="font-display text-sm font-bold tracking-widest text-glow-fuchsia">
                {title}
              </h3>
            )}
          </div>
          {status && (
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flicker ${statusDot}`} />
              <span className={`font-mono-data text-[10px] ${statusColor}`}>{status}</span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
