import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Dock.css';

export interface DockItemData {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

interface DockItemProps {
  icon: ReactNode;
  label: string;
  className?: string;
  onClick: () => void;
  mouseX: ReturnType<typeof useMotionValue<number>>;
  spring: SpringOptions;
  distance: number;
  magnification: number;
  baseItemSize: number;
  isFocused: boolean;
  onFocusRequest: () => void;
}

interface SpringOptions {
  mass: number;
  stiffness: number;
  damping: number;
}

function DockItem({
  icon,
  label,
  className = '',
  onClick,
  mouseX,
  spring,
  distance,
  magnification,
  baseItemSize,
  isFocused,
  onFocusRequest,
}: DockItemProps) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, (val) => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize,
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(
    mouseDistance,
    [-distance, 0, distance],
    [baseItemSize, magnification, baseItemSize],
  );
  const size = useSpring(targetSize, spring);

  useEffect(() => {
    if (isFocused) {
      ref.current?.focus({ preventScroll: false });
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [isFocused]);

  return (
    <motion.button
      ref={ref}
      type="button"
      style={{ width: size, height: size, minWidth: baseItemSize, minHeight: baseItemSize }}
      onHoverStart={() => isHovered.set(1)}
      onHoverEnd={() => isHovered.set(0)}
      onFocus={() => isHovered.set(1)}
      onBlur={() => isHovered.set(0)}
      onClick={onClick}
      onFocusCapture={onFocusRequest}
      className={`dock-item ${className}`}
      aria-label={label}
    >
      <span className="dock-icon" aria-hidden="true">
        {icon}
      </span>
      <DockLabel isHovered={isHovered}>{label}</DockLabel>
    </motion.button>
  );
}

interface DockLabelProps {
  children: ReactNode;
  className?: string;
  isHovered: ReturnType<typeof useMotionValue<number>>;
}

function DockLabel({ children, className = '', isHovered }: DockLabelProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = isHovered.on('change', (latest) => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 0 }}
          animate={{ opacity: 1, y: -10 }}
          exit={{ opacity: 0, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`dock-label ${className}`}
          role="tooltip"
          style={{ x: '-50%' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DockProps {
  items: DockItemData[];
  className?: string;
  distance?: number;
  panelHeight?: number;
  baseItemSize?: number;
  magnification?: number;
  spring?: SpringOptions;
}

export default function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  baseItemSize = 50,
}: DockProps) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const scrollPos = useRef(0);
  const touchStartX = useRef(0);
  const touchStartScroll = useRef(0);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  }, []);

  const responsiveBaseSize = isMobile ? Math.min(baseItemSize, 40) : baseItemSize;
  const responsivePanelHeight = isMobile ? Math.min(panelHeight, 58) : panelHeight;
  const responsiveMagnification = isMobile ? Math.min(magnification, 60) : magnification;
  const responsiveDistance = isMobile ? Math.min(distance, 150) : distance;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Home' && e.key !== 'End')
        return;

      const activeElement = document.activeElement;
      const isInDock = panelRef.current?.contains(activeElement);
      if (!isInDock) return;

      e.preventDefault();

      if (e.key === 'Home') {
        setFocusedIndex(0);
        return;
      }
      if (e.key === 'End') {
        setFocusedIndex(items.length - 1);
        return;
      }

      setFocusedIndex((prev) => {
        if (prev < 0) return 0;
        if (e.key === 'ArrowRight') return (prev + 1) % items.length;
        if (e.key === 'ArrowLeft') return (prev - 1 + items.length) % items.length;
        return prev;
      });
    },
    [items.length],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const syncScroll = useCallback(() => {
    if (!itemsRef.current) return;
    itemsRef.current.style.transform = `translateX(${-scrollPos.current}px)`;
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const panel = panelRef.current;
      if (!panel || !itemsRef.current) return;
      const maxScroll = Math.max(0, itemsRef.current.scrollWidth - panel.clientWidth);
      scrollPos.current = Math.max(0, Math.min(scrollPos.current + e.deltaX, maxScroll));
      syncScroll();
    },
    [syncScroll],
  );

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.addEventListener('wheel', handleWheel, { passive: false });
    return () => panel.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartScroll.current = scrollPos.current;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const panel = panelRef.current;
      if (!panel || !itemsRef.current) return;
      const dx = touchStartX.current - e.touches[0].clientX;
      const maxScroll = Math.max(0, itemsRef.current.scrollWidth - panel.clientWidth);
      scrollPos.current = Math.max(0, Math.min(touchStartScroll.current + dx, maxScroll));
      syncScroll();
    },
    [syncScroll],
  );

  return (
    <motion.div
      ref={panelRef}
      onMouseMove={({ pageX }) => {
        isHovered.set(1);
        mouseX.set(pageX);
      }}
      onMouseLeave={() => {
        isHovered.set(0);
        mouseX.set(Infinity);
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className={`dock-panel ${className}`}
      style={{ height: responsivePanelHeight }}
      role="toolbar"
      aria-label="Main navigation"
      aria-orientation="horizontal"
    >
      <div ref={itemsRef} className="dock-items">
        {items.map((item, index) => (
          <DockItem
            key={`${item.label}-${index}`}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            className={item.className}
            mouseX={mouseX}
            spring={spring}
            distance={responsiveDistance}
            magnification={responsiveMagnification}
            baseItemSize={responsiveBaseSize}
            isFocused={focusedIndex === index}
            onFocusRequest={() => setFocusedIndex(index)}
          />
        ))}
      </div>
    </motion.div>
  );
}
