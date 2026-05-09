import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TerminalLineProps {
  text: string;
  delay?: number;
  className?: string;
  prefix?: string;
  accent?: 'fuchsia' | 'cyan' | 'yellow';
}

export function TerminalLine({
  text,
  delay = 0,
  className = '',
  prefix = '>',
  accent = 'cyan',
}: TerminalLineProps) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  const accentColor =
    accent === 'fuchsia'
      ? 'var(--neon-fuchsia)'
      : accent === 'yellow'
        ? 'var(--neon-yellow)'
        : 'var(--neon-cyan)';

  useEffect(() => {
    const initTimer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(initTimer);
  }, [delay]);

  useEffect(() => {
    if (!visible || done) return;

    let i = 0;
    const interval = setInterval(
      () => {
        i += 1;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setDone(true);
        }
      },
      15 + Math.random() * 25,
    );

    return () => clearInterval(interval);
  }, [visible, done, text]);

  return (
    <div
      className={cn(
        'font-mono-data text-[11px] tracking-wider transition-opacity duration-200',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <span style={{ color: accentColor, textShadow: `0 0 6px ${accentColor}` }}>{prefix} </span>
      <span className="text-muted-foreground">{displayed}</span>
      {!done && (
        <span
          className="inline-block w-1.5 h-3.5 ml-0.5 align-middle animate-pulse-soft"
          style={{ backgroundColor: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
        />
      )}
    </div>
  );
}
