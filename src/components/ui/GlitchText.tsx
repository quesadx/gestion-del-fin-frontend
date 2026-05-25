import './GlitchText.css';

interface GlitchTextProps {
  children: string;
  speed?: number;
  enableShadows?: boolean;
  enableOnHover?: boolean;
  className?: string;
}

export default function GlitchText({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  className = '',
}: GlitchTextProps) {
  const inlineStyles = {
    '--after-shadow': enableShadows ? '-4px 0 #f97316' : 'none',
    '--before-shadow': enableShadows ? '4px 0 #ef4444' : 'none',
  } as React.CSSProperties;

  const hoverClass = enableOnHover ? 'enable-on-hover' : '';

  return (
    <div className={`glitch ${hoverClass} ${className}`} style={inlineStyles} data-text={children}>
      {children}
    </div>
  );
}
