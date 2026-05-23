export function HoloLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gdf-surface-root">
      <div className="relative mb-8 h-12 w-12">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-gdf-accent-secondary animate-spin"
          style={{ animationDuration: '0.8s' }}
        />
        <div
          className="absolute inset-3 rounded-full border border-transparent border-b-gdf-accent-primary animate-spin"
          style={{ animationDuration: '1.2s', animationDirection: 'reverse' }}
        />
        <div className="absolute inset-[22px] bg-gdf-accent-secondary animate-pulse rounded-full w-2 h-2 m-auto" />
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <div
            className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gdf-accent-secondary/20 to-transparent animate-scanner-sweep opacity-40"
            style={{ animationDuration: '3s' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 font-mono text-xs text-gdf-text-muted">
        <span className="animate-blink text-gdf-accent-secondary">&#9654;</span>
        <span className="tracking-[0.2em] uppercase">SYSTEM ONLINE</span>
        <span className="animate-blink text-gdf-accent-secondary">&#9654;</span>
      </div>
    </div>
  );
}
