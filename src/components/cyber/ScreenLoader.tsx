import { useEffect, useState } from 'react';

const LOADING_LINES = [
  'BOOT_SEQUENCE INITIALIZED',
  'MEMORY CHECK: OK',
  'SENSOR CALIBRATION IN PROGRESS...',
  'NEON INTERFACE: ONLINE',
  'ESTABLISHING SECURE LINK...',
];

export function ScreenLoader() {
  const [visibleLines, setVisibleLines] = useState(1);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (visibleLines >= LOADING_LINES.length) {
      const cursorTimer = setInterval(() => setShowCursor((c) => !c), 530);
      return () => clearInterval(cursorTimer);
    }

    const timer = setTimeout(
      () => setVisibleLines((v) => Math.min(v + 1, LOADING_LINES.length)),
      250 + Math.random() * 400,
    );

    return () => clearTimeout(timer);
  }, [visibleLines]);

  const allDone = visibleLines >= LOADING_LINES.length;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--background)]">
      {/* Animated neon spinner */}
      <div className="relative mb-10 h-14 w-14">
        {/* Outer ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: '2px solid transparent',
            borderTopColor: 'var(--neon-fuchsia)',
            borderRightColor: 'var(--neon-cyan)',
            animation: 'loader-spin 1s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
            boxShadow:
              '0 0 12px var(--neon-fuchsia), 0 0 30px var(--neon-cyan), inset 0 0 8px var(--neon-fuchsia)',
          }}
        />
        {/* Inner ring */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            border: '1px solid transparent',
            borderBottomColor: 'var(--neon-cyan)',
            borderLeftColor: 'var(--neon-fuchsia)',
            animation: 'loader-spin-reverse 0.8s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
            opacity: 0.7,
          }}
        />
        {/* Center dot */}
        <div
          className="absolute inset-[22px] rounded-full"
          style={{
            background: 'var(--neon-fuchsia)',
            boxShadow: '0 0 10px var(--neon-fuchsia)',
            animation: 'loader-pulse 1.5s ease-in-out infinite',
          }}
        />
      </div>

      {/* Loading lines */}
      <div className="flex flex-col items-center gap-1.5 font-mono-data text-xs tracking-widest">
        {LOADING_LINES.slice(0, visibleLines).map((line, i) => (
          <span
            key={i}
            className="text-[var(--neon-cyan)] opacity-0"
            style={{
              animation: 'loader-fade-in 0.3s ease-out forwards',
              textShadow: '0 0 6px var(--neon-cyan)',
            }}
          >
            &gt; {line}
          </span>
        ))}
      </div>

      {/* Blinking cursor */}
      {allDone && (
        <div className="mt-4 flex items-center gap-2 font-mono-data text-xs tracking-widest text-[var(--neon-fuchsia)]">
          <span
            style={{
              textShadow: '0 0 8px var(--neon-fuchsia)',
            }}
          >
            READY
          </span>
          <span
            className="inline-block h-3.5 w-2 bg-[var(--neon-fuchsia)]"
            style={{
              opacity: showCursor ? 1 : 0,
              transition: 'opacity 0.1s step-end',
              boxShadow: '0 0 6px var(--neon-fuchsia)',
            }}
          />
        </div>
      )}
    </div>
  );
}
