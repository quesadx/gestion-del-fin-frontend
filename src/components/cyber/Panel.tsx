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
  return (
    <div className={`relative glass-panel clip-corners p-5 ${className}`}>
      {/* corner brackets */}
      <span
        className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2"
        style={{ borderColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
      />
      <span
        className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2"
        style={{ borderColor: accentColor, boxShadow: `0 0 8px ${accentColor}` }}
      />

      {(title || tag) && (
        <div
          className="flex items-center justify-between mb-4 pb-2 border-b"
          style={{ borderColor: 'oklch(0.68 0.32 340 / 0.3)' }}
        >
          <div className="flex items-center gap-3">
            {tag && (
              <span
                className="font-mono-data text-[10px] px-2 py-0.5 clip-tag"
                style={{ background: accentColor, color: 'var(--charcoal)' }}
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
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)] flicker"
                style={{ boxShadow: '0 0 8px var(--neon-cyan)' }}
              />
              <span className="font-mono-data text-[10px] text-[var(--neon-cyan)]">{status}</span>
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
