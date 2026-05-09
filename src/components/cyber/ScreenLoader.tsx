export function ScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-base">
      <div className="grid-overlay" />

      {/* Spinner */}
      <div className="relative mb-8 h-12 w-12">
        <div className="absolute inset-0 border-2 border-transparent border-t-accent-primary animate-spin"
          style={{ animationDuration: '0.8s', boxShadow: '0 0 12px var(--accent-primary), inset 0 0 8px oklch(0.65 0.28 210 / 0.2)' }}
        />
        <div className="absolute inset-3 border border-transparent border-b-accent-primary animate-spin"
          style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}
        />
        <div className="absolute inset-[22px] bg-accent-primary animate-pulse-glow"
          style={{ boxShadow: '0 0 10px var(--accent-primary)' }}
        />
      </div>

      {/* Label */}
      <div className="flex items-center gap-2 font-mono-sm text-text-muted">
        <span className="animate-blink text-accent-primary">▸</span>
        <span className="tracking-[0.2em] uppercase">Initializing Terminal</span>
        <span className="animate-blink text-accent-primary">▸</span>
      </div>
    </div>
  );
}
