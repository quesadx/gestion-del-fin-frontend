import {
  createContext,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type Dispatch,
  type ElementType,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { cn } from '../../lib/utils';

type MouseEnterContextValue = [boolean, Dispatch<SetStateAction<boolean>>];

const MouseEnterContext = createContext<MouseEnterContextValue | undefined>(undefined);

export function CardContainer({
  children,
  className,
  containerClassName,
}: {
  children?: ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = useState(false);

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - left - width / 2) / 60;
    const y = (event.clientY - top - height / 2) / 60;

    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`;
  };

  const handleMouseEnter = () => {
    setIsMouseEntered(true);
  };

  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (!containerRef.current) return;
    containerRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)';
  };

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={cn('flex items-center justify-center', containerClassName)}
        style={{ perspective: '1200px' }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={cn(
            'relative transition-transform duration-200 ease-out will-change-transform',
            className,
          )}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'relative [transform-style:preserve-3d] [&>*]:[transform-style:preserve-3d]',
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardItemProps<T extends ElementType = 'div'> = {
  as?: T;
  children: ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

export function CardItem<T extends ElementType = 'div'>({
  as,
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: CardItemProps<T>) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [isMouseEntered] = useMouseEnter();
  const forwardedProps = rest as Record<string, unknown>;

  useEffect(() => {
    if (!ref.current) return;

    ref.current.style.transform = isMouseEntered
      ? `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
      : 'translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)';
  }, [isMouseEntered, rotateX, rotateY, rotateZ, translateX, translateY, translateZ]);

  return (
    <Tag
      ref={ref as never}
      className={cn('transition-transform duration-200 ease-out', className)}
      {...forwardedProps}
    >
      {children}
    </Tag>
  );
}

function useMouseEnter() {
  const context = useContext(MouseEnterContext);
  if (!context) {
    throw new Error('useMouseEnter must be used within a CardContainer');
  }
  return context;
}
