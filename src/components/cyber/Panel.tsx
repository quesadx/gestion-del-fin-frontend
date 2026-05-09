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
  const accentColor = accent === 'fuchsia' ? 'var(--neon-fuchsia)' : 'var(--neon-cyan)';
  const accentBg = accent === 'fuchsia' ? 'bg-[var(--neon-fuchsia)]' : 'bg-[var(--neon-cyan)]';
  const statusColor =
    accent === 'fuchsia' ? 'text-[var(--neon-fuchsia)]' : 'text-[var(--neon-cyan)]';
  const statusDot =
    accent === 'fuchsia'
      ? 'bg-[var(--neon-fuchsia)] shadow-[0_0_8px_var(--neon-fuchsia)]'
      : 'bg-[var(--neon-cyan)] shadow-[0_0_8px_var(--neon-cyan)]';

  return (
    <div
      className={`relative rounded-sm border border-[oklch(0.68_0.32_340_/_0.15)] bg-[oklch(0.1_0.03_320_/_0.35)] p-5 shadow-[0_0_40px_rgba(0,0,0,0.2)] backdrop-blur-2xl ${className}`}
    >
      {/* Corner brackets — breathe softly */}
      <span
        className="absolute -top-px -left-px h-3 w-3 border-t-2 border-l-2 animate-corner-breathe"
        style={{ borderColor: accentColor }}
      />
      <span
        className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 animate-corner-breathe"
        style={{ borderColor: accentColor, animationDelay: '2s' }}
      />
      <span
        className="absolute -top-px -right-px h-2 w-2 border-t border-r opacity-20"
        style={{ borderColor: accentColor }}
      />
      <span
        className="absolute -bottom-px -left-px h-2 w-2 border-b border-l opacity-20"
        style={{ borderColor: accentColor }}
      />

      {/* Header */}
      {(title || tag) && (
        <div className="flex items-center justify-between gap-3 border-b pb-3 mb-4 border-[oklch(0.68_0.32_340_/_0.25)]">
          <div className="flex flex-wrap items-center gap-3">
            {tag && (
              <span
                className={`font-mono-data text-[10px] px-2 py-0.5 clip-tag ${accentBg} text-[var(--charcoal)]`}
              >
                {tag}
              </span>
            )}
            {title && (
              <h3 className="font-display text-sm font-bold tracking-widest text-glow-fuchsia leading-none">
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
