import { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'warning' | 'danger';
}

export function GlitchButton({ children, variant = 'primary', className = '', ...rest }: Props) {
  const styles = {
    primary:
      'bg-[var(--neon-fuchsia)] text-[var(--charcoal)] hover:shadow-[0_0_20px_var(--neon-fuchsia)] active:shadow-[0_0_8px_var(--neon-fuchsia)]',
    warning:
      'bg-[var(--neon-yellow)] text-[var(--charcoal)] hover:shadow-[0_0_20px_var(--neon-yellow)] active:shadow-[0_0_8px_var(--neon-yellow)]',
    ghost:
      'bg-transparent border border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.08)] hover:border-[var(--neon-cyan)] hover:shadow-[0_0_16px_var(--neon-cyan)_/_0.15]',
    danger:
      'bg-[#ff3355] text-white hover:shadow-[0_0_20px_#ff3355] active:shadow-[0_0_8px_#ff3355]',
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
