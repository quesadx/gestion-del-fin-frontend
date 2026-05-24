import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import ClickSpark from '@/components/ClickSpark';

interface TacticalButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'warning' | 'danger';
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  type?: 'button' | 'submit' | 'reset';
}

const VARIANT_CLASSES: Record<string, string> = {
  primary: 'bg-gdf-accent-primary text-gdf-text-inverse hover:bg-gdf-accent-primary-dim',
  warning: 'bg-gdf-status-warning text-gdf-text-inverse hover:brightness-110',
  ghost:
    'bg-transparent border border-gdf-border-default text-gdf-text-secondary hover:border-gdf-accent-primary hover:text-gdf-accent-primary',
  danger:
    'bg-transparent border border-gdf-status-danger/30 text-gdf-status-danger hover:bg-gdf-status-danger/10 hover:border-gdf-status-danger',
};

export function TacticalButton({
  children,
  variant = 'primary',
  className = '',
  disabled,
  onClick,
  type,
  ...rest
}: TacticalButtonProps) {
  const button = (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', visualDuration: 0.2, bounce: 0.3 }}
      disabled={disabled}
      onClick={onClick}
      type={type}
      className={cn(
        'font-mono text-xs tracking-wider uppercase px-5 py-2.5 rounded-md gdf-btn-press disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
        VARIANT_CLASSES[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </motion.button>
  );

  if (variant === 'primary' && !disabled) {
    return (
      <ClickSpark sparkColor="#3b82f6" sparkSize={4} sparkCount={10} duration={400}>
        {button}
      </ClickSpark>
    );
  }

  return button;
}
