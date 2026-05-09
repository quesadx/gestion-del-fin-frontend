import { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'warning';
}

export function GlitchButton({ children, variant = 'primary', className = '', ...rest }: Props) {
  const styles = {
    primary:
      'bg-[var(--neon-fuchsia)] text-[var(--charcoal)] hover:shadow-[var(--glow-fuchsia)]',
    warning:
      'bg-[var(--neon-yellow)] text-[var(--charcoal)] hover:shadow-[var(--glow-yellow)]',
    ghost:
      'bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] hover:shadow-[var(--glow-cyan)]',
  };
  return (
    <button
      data-text={typeof children === 'string' ? children : ''}
      className={`glitch-hover clip-corners-sm font-tech text-xs font-bold px-5 py-2.5 transition-colors duration-150 ${styles[variant]} ${className}`}
      {...rest}
    >
      <span className="relative z-10">{children}</span>
    </button>
  );
}
