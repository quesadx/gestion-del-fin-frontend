interface RingMeterProps {
  value: number;
  label: string;
  sublabel?: string;
  color?: 'cyan' | 'amber' | 'yellow';
  size?: number;
}

const colorMap = {
  cyan: 'var(--accent-primary)',
  amber: 'var(--accent-secondary)',
  yellow: '#ffab00',
};

export function RingMeter({ value, label, sublabel, color = 'cyan', size = 140 }: RingMeterProps) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  const c = colorMap[color];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <filter id={`glow-${color}`}>
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="oklch(0.2 0.02 240 / 0.4)"
            strokeWidth={stroke}
            fill="none"
          />
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * 360;
            return (
              <line
                key={i}
                x1={size / 2}
                y1={4}
                x2={size / 2}
                y2={10}
                stroke="oklch(0.4 0.05 240 / 0.3)"
                strokeWidth="1"
                transform={`rotate(${angle} ${size / 2} ${size / 2})`}
              />
            );
          })}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={c}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="butt"
            filter={`url(#glow-${color})`}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            className="font-display text-3xl font-bold"
            style={{ color: c, textShadow: `0 0 12px ${c}` }}
          >
            {value}
            <span className="text-sm opacity-70">%</span>
          </div>
          {sublabel && (
            <div className="font-mono-data text-[10px] text-muted-foreground mt-1">{sublabel}</div>
          )}
        </div>
      </div>
      <div className="font-tech text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
