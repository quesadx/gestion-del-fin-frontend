import { useEffect, useRef, useState, useCallback } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
}

const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 50,
  maxIterations = 15,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  className = '',
  parentClassName = '',
  encryptedClassName = '',
  animateOn = 'view',
}) => {
  const [display, setDisplay] = useState(text);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iterationRef = useRef(0);

  const decrypt = useCallback(() => {
    iterationRef.current = 0;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      iterationRef.current += 1;

      setDisplay(
        text
          .split('')
          .map((char, idx) => {
            if (char === ' ') return ' ';
            if (idx < iterationRef.current / maxIterations) return text[idx];
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join(''),
      );

      if (iterationRef.current >= maxIterations) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setDisplay(text);
      }
    }, speed);
  }, [text, speed, maxIterations, characters]);

  useEffect(() => {
    if (animateOn === 'view') {
      const el = ref.current;
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            decrypt();
            observer.unobserve(el);
          }
        },
        { threshold: 0.1 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [animateOn, started, decrypt]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (animateOn === 'hover' && !started) {
      setStarted(true);
      decrypt();
    }
  };

  return (
    <span ref={ref} className={parentClassName} onMouseEnter={handleMouseEnter} aria-label={text}>
      {started ? (
        <span className={className}>{display}</span>
      ) : (
        <span className={encryptedClassName || className}>{text}</span>
      )}
    </span>
  );
};

export default DecryptedText;
