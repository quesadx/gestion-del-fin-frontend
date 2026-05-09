import { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'warning' | 'danger';
}

export function GlitchButton({ children, variant = 'primary', className = '', ...rest }: Props) {
  const styles = {
    primary:
      'bg-accent-primary text-surface-base font-bold hover:shadow-glow active:opacity-80 border border-accent-primary/30',
    warning:
      'bg-status-yellow text-surface-base font-bold hover:shadow-[0_0_20px_#ffab00] active:opacity-80 border border-[#ffab00]/30',
    ghost:
      'bg-transparent border border-border text-text-secondary hover:border-accent-primary/50 hover:text-accent-primary hover:shadow-glow',
    danger:
      'bg-transparent border border-status-red/40 text-status-red hover:bg-status-red/10 hover:border-status-red hover:shadow-[0_0_16px_#ff3355]',
  };
  return (
    <button
      className={`font-mono text-xs tracking-[0.1em] uppercase px-5 py-2.5 rounded-none transition-all duration-150 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
