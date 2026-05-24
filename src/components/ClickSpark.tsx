import { useRef, useEffect, useState, useCallback, ReactNode } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface ClickSparkProps {
  children: ReactNode;
  sparkColor?: string;
  sparkSize?: number;
  sparkCount?: number;
  duration?: number;
}

const ClickSpark: React.FC<ClickSparkProps> = ({
  children,
  sparkColor = '#3b82f6',
  sparkSize = 3,
  sparkCount = 10,
  duration = 400,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [frame, setFrame] = useState(0);

  const paramsRef = useRef({ sparkColor, sparkCount, sparkSize, duration });

  useEffect(() => {
    paramsRef.current = { sparkColor, sparkCount, sparkSize, duration };
  });

  useEffect(() => {
    if (frame === 0 && particlesRef.current.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    const params = paramsRef.current;

    const loop = () => {
      const particles = particlesRef.current;
      if (particles.length === 0) {
        setFrame(0);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = params.sparkColor;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 16;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;

        const alpha = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      if (particles.length > 0) {
        frameId = requestAnimationFrame(loop);
      } else {
        setFrame(0);
      }
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [frame]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const p = paramsRef.current;

    for (let i = 0; i < p.sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / p.sparkCount + (Math.random() - 0.5) * 0.5;
      const speed = 0.5 + Math.random() * 2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: p.duration,
        maxLife: p.duration,
        size: p.sparkSize * (0.5 + Math.random() * 0.5),
      });
    }

    setFrame((f) => f + 1);
  }, []);

  return (
    <div ref={containerRef} onClick={handleClick} className="relative inline-block">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-10"
        width={1}
        height={1}
      />
      {children}
    </div>
  );
};

export default ClickSpark;
