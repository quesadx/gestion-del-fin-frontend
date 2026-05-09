export function WaveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep base */}
      <div className="absolute inset-0 bg-surface-base" />

      {/* Soft ambient blobs */}
      <div className="absolute -top-[25%] -left-[12%] w-[65vw] h-[65vw] opacity-20"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.28 210 / 0.4), transparent 60%)',
          filter: 'blur(100px)',
          animation: 'drift 22s ease-in-out infinite alternate',
        }}
      />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] opacity-18"
        style={{
          background: 'radial-gradient(circle, oklch(0.55 0.25 280 / 0.35), transparent 60%)',
          filter: 'blur(110px)',
          animation: 'drift 28s ease-in-out infinite alternate-reverse',
        }}
      />
      <div className="absolute top-[30%] left-[35%] w-[45vw] h-[45vw] opacity-12"
        style={{
          background: 'radial-gradient(circle, oklch(0.5 0.2 240 / 0.3), transparent 60%)',
          filter: 'blur(100px)',
          animation: 'drift 35s ease-in-out infinite alternate',
        }}
      />

      {/* Vignette */}
      <div className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, oklch(0.04 0.01 255 / 0.7) 100%)',
        }}
      />
    </div>
  );
}
