export function WaveBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep base */}
      <div className="absolute inset-0 bg-[var(--background)]" />

      {/* Soft wave blobs — pure CSS, organic, lovable */}
      <div
        className="absolute -top-[30%] -left-[15%] w-[70vw] h-[70vw] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, oklch(0.6 0.30 340 / 0.6), transparent 65%)',
          filter: 'blur(100px)',
          animation: 'wave-drift-1 20s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute -bottom-[25%] -right-[10%] w-[75vw] h-[75vw] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, oklch(0.5 0.28 300 / 0.5), transparent 65%)',
          filter: 'blur(110px)',
          animation: 'wave-drift-2 25s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[20%] left-[40%] w-[50vw] h-[50vw] rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, oklch(0.65 0.32 320 / 0.45), transparent 65%)',
          filter: 'blur(120px)',
          animation: 'wave-drift-3 30s ease-in-out infinite alternate',
        }}
      />
      <div
        className="absolute top-[60%] -left-[5%] w-[40vw] h-[40vw] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, oklch(0.55 0.28 280 / 0.4), transparent 65%)',
          filter: 'blur(100px)',
          animation: 'wave-drift-1 35s ease-in-out infinite alternate-reverse',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, oklch(0.05 0.03 320 / 0.6) 100%)',
        }}
      />
    </div>
  );
}
