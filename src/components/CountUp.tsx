import { useEffect, useRef, useState } from 'react';

interface CountUpProps {
  from?: number;
  to: number;
  separator?: string;
  direction?: 'up' | 'down';
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  onStart?: () => void;
  onEnd?: () => void;
}

const CountUp: React.FC<CountUpProps> = ({
  from = 0,
  to,
  separator = '',
  direction = 'up',
  duration = 1.2,
  className = '',
  prefix = '',
  suffix = '',
  decimals = 0,
  onStart,
  onEnd,
}) => {
  const [value, setValue] = useState(from);
  const ref = useRef<HTMLSpanElement>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || hasStarted.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          hasStarted.current = true;
          onStart?.();
          observer.unobserve(el);

          const startTime = performance.now();
          const startValue = direction === 'up' ? from : to;
          const endValue = direction === 'up' ? to : from;

          const tick = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = startValue + (endValue - startValue) * eased;

            if (progress < 1) {
              setValue(current);
              requestAnimationFrame(tick);
            } else {
              setValue(endValue);
              onEnd?.();
            }
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [from, to, direction, duration, onStart, onEnd]);

  const formatValue = (v: number) => {
    const fixed = v.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');
    const formatted = separator ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, separator) : intPart;
    return decimals > 0 ? `${formatted}.${decPart}` : formatted;
  };

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatValue(value)}
      {suffix}
    </span>
  );
};

export default CountUp;
