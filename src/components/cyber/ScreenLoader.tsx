export function ScreenLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-surface-base">
      <div className="relative mb-8 h-12 w-12">
        <div
          className="absolute inset-0 border-2 border-transparent border-t-brand-primary animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
        <div
          className="absolute inset-3 border border-transparent border-b-brand-primary animate-spin"
          style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}
        />
        <div className="absolute inset-[22px] bg-brand-primary animate-pulse" />
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
        <span className="animate-blink text-brand-primary">▸</span>
        <span className="tracking-[0.2em] uppercase">Initializing Interface</span>
        <span className="animate-blink text-brand-primary">▸</span>
      </div>
    </div>
  );
}
