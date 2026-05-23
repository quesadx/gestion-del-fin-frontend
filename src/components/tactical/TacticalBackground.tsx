import { useEffect, useCallback, useRef } from 'react';

export function TacticalBackground() {
  const rafRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  const handleMove = useCallback((e: MouseEvent) => {
    const now = performance.now();
    if (now - lastUpdateRef.current < 50) return;
    lastUpdateRef.current = now;

    rafRef.current = requestAnimationFrame(() => {
      document.documentElement.style.setProperty(
        '--gdf-cursor-x',
        `${(e.clientX / window.innerWidth) * 100}%`,
      );
      document.documentElement.style.setProperty(
        '--gdf-cursor-y',
        `${(e.clientY / window.innerHeight) * 100}%`,
      );
    });
  }, []);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) {
      document.documentElement.style.setProperty('--gdf-reduced-motion', '1');
    }

    const touchDevice = window.matchMedia('(pointer: coarse)');
    if (!touchDevice.matches) {
      window.addEventListener('mousemove', handleMove, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleMove]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[-10] overflow-hidden" aria-hidden="true">
      <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.12),transparent_55%)] blur-[80px] animate-ambient-drift-1" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10),transparent_55%)] blur-[90px] animate-ambient-drift-2" />
      <div
        className="hidden md:block fixed inset-0 transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(600px circle at var(--gdf-cursor-x, 50%) var(--gdf-cursor-y, 50%), rgba(59,130,246,0.06), transparent 60%)',
        }}
      />
      <div
        className="fixed top-0 left-0 right-0 h-[2px] opacity-[0.15] animate-scanner-sweep"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--gdf-accent-secondary), transparent)',
          animationDuration: '8s',
        }}
      />
    </div>
  );
}
