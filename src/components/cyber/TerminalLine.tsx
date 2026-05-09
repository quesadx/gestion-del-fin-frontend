import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TerminalLineProps {
  text: string;
  delay?: number;
  className?: string;
  prefix?: string;
  accent?: 'cyan' | 'purple' | 'green';
}

export function TerminalLine({
  text,
  delay = 0,
  className = '',
  prefix = '›',
  accent = 'cyan',
}: TerminalLineProps) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  const accentColor =
    accent === 'purple' ? 'text-accent-secondary' :
    accent === 'green' ? 'text-status-green' :
    'text-accent-primary';

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
      12 + Math.random() * 20,
    );

    return () => clearInterval(interval);
  }, [visible, done, text]);

  return (
    <div className={cn('font-mono text-xs transition-opacity duration-200', visible ? 'opacity-100' : 'opacity-0', className)}>
      <span className={accentColor}>{prefix} </span>
      <span className="text-text-secondary">{displayed}</span>
      {!done && <span className={`inline-block w-[6px] h-[14px] ml-0.5 align-middle animate-blink ${accentColor}`}>▌</span>}
    </div>
  );
}
