export function HolographicRadar() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      >
        <div
          className="rounded-full border border-gdf-accent-secondary"
          style={{
            width: '40vw',
            height: '40vw',
            opacity: 0.03,
          }}
          aria-hidden="true"
        />
        <div
          className="rounded-full border border-gdf-accent-secondary"
          style={{
            width: '60vw',
            height: '60vw',
            opacity: 0.03,
            position: 'absolute',
          }}
          aria-hidden="true"
        />
        <div
          className="rounded-full border border-gdf-accent-secondary"
          style={{
            width: '85vw',
            height: '85vw',
            opacity: 0.03,
            position: 'absolute',
          }}
          aria-hidden="true"
        />

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            animation: 'var(--gdf-reduced-motion, radar-sweep-rotate 12s linear infinite)',
          }}
          aria-hidden="true"
        >
          <div
            className="rounded-full"
            style={{
              width: '40vw',
              height: '40vw',
              opacity: 'var(--gdf-radar-opacity, 0.03)',
              background:
                'conic-gradient(from 0deg, transparent 0deg, rgba(6,182,212,0.06) 60deg, transparent 90deg, transparent 360deg)',
            }}
            aria-hidden="true"
          />
        </div>

        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '20%',
            top: '30%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '70%',
            top: '20%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '50%',
            top: '50%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '30%',
            top: '70%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '75%',
            top: '45%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '25%',
            top: '55%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '60%',
            top: '75%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary"
          style={{
            width: '2px',
            height: '2px',
            left: '40%',
            top: '40%',
            opacity: 0.15,
          }}
          aria-hidden="true"
        />

        <div
          className="absolute rounded-full bg-gdf-accent-secondary animate-blink"
          style={{
            width: '2px',
            height: '2px',
            left: '45%',
            top: '60%',
            animationDuration: '3s',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute rounded-full bg-gdf-accent-secondary animate-blink"
          style={{
            width: '2px',
            height: '2px',
            left: '65%',
            top: '35%',
            animationDuration: '3s',
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
