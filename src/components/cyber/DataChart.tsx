import { useMemo } from 'react';

export function DataChart() {
  const points = useMemo(() => {
    const arr = Array.from({ length: 32 }, (_, i) => {
      const base = 50 + Math.sin(i * 0.5) * 25 + Math.cos(i * 0.3) * 15;
      return Math.max(8, Math.min(95, base + (i % 5) * 3));
    });
    return arr;
  }, []);

  const w = 600,
    h = 180;
  const stepX = w / (points.length - 1);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${h - (p / 100) * h}`)
    .join(' ');
  const area = `${path} L ${w} ${h} L 0 ${h} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--neon-fuchsia)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--neon-fuchsia)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* grid */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line
            key={i}
            x1="0"
            x2={w}
            y1={(h / 4) * i}
            y2={(h / 4) * i}
            stroke="oklch(0.85 0.22 200 / 0.08)"
            strokeDasharray="3 4"
          />
        ))}
        <path d={area} fill="url(#chartFill)" />
        <path
          d={path}
          fill="none"
          stroke="var(--neon-fuchsia)"
          strokeWidth="1.5"
          style={{ filter: 'drop-shadow(0 0 6px var(--neon-fuchsia))' }}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={i * stepX}
            cy={h - (p / 100) * h}
            r={i % 4 === 0 ? 2 : 0}
            fill="var(--neon-cyan)"
          />
        ))}
      </svg>
      <div className="absolute inset-0 pointer-events-none scanlines" />
    </div>
  );
}
