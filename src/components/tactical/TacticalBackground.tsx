import { useEffect, useCallback, useRef } from 'react';
import { HolographicRadar } from './HolographicRadar';

function createParticles() {
  return Array.from({ length: 60 }).map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 2.5 + Math.random() * 4,
    delay: Math.random() * 5,
    opacity: 0.3 + Math.random() * 0.4,
  }));
}

const staticParticles = createParticles();

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
      <div className="gdf-bg-grid animate-grid-drift" />
      <HolographicRadar />
      <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.12),transparent_55%)] blur-[80px] animate-ambient-drift-1" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.10),transparent_55%)] blur-[90px] animate-ambient-drift-2" />
      <div
        className="absolute -top-[30%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08),transparent_55%)] blur-[100px] animate-ambient-drift-1"
        style={{ animationDuration: '30s', animationDirection: 'alternate-reverse' }}
      />
      <div
        className="fixed top-0 left-0 right-0 h-[2px] animate-scanner-sweep"
        style={{
          background:
            'linear-gradient(90deg, transparent, var(--gdf-accent-secondary), transparent)',
          animationDuration: '8s',
          opacity: 'var(--gdf-scanner-opacity, 0.15)',
        }}
      />
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {staticParticles.map((p, i) => (
          <div
            key={i}
            className="absolute w-[2px] h-[2px] bg-gdf-accent-secondary/30 rounded-full animate-pulse-glow"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>
    </div>
  );
}
