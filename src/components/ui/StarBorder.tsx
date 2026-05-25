import './StarBorder.css';
import React from 'react';

type StarBorderOwnProps = {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  thickness?: number;
  children?: React.ReactNode;
};

type Props = StarBorderOwnProps &
  React.ButtonHTMLAttributes<HTMLElement> &
  React.HTMLAttributes<HTMLElement>;

const StarBorder = ({
  as: As = 'button',
  className = '',
  color = 'white',
  speed = '6s',
  thickness = 1,
  children,
  ...rest
}: Props) => {
  const style = {
    padding: `${thickness}px 0`,
    ...(rest.style as React.CSSProperties),
  };

  const Component: React.ElementType = As as React.ElementType;

  return (
    <Component className={`star-border-container ${className}`} style={style} {...rest}>
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed,
        }}
      />
      <div className="inner-content">{children}</div>
    </Component>
  );
};

export default StarBorder;
