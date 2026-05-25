import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefAttributes,
  type ReactElement,
  type RefObject,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import gsap from 'gsap';
import './CardSwap.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  customClass?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, className, ...rest }, ref) => (
    <div ref={ref} {...rest} className={`card ${customClass ?? ''} ${className ?? ''}`.trim()} />
  ),
);
Card.displayName = 'Card';

type EasingType = 'linear' | 'elastic';

interface Slot {
  x: number;
  y: number;
  z: number;
  zIndex: number;
}

interface CardSwapProps {
  width?: number | string;
  height?: number | string;
  cardDistance?: number;
  verticalDistance?: number;
  delay?: number;
  autoPlay?: boolean;
  manualSwapTick?: number;
  manualSwapDirection?: 1 | -1;
  bringToFrontOnClick?: boolean;
  pauseOnHover?: boolean;
  onCardClick?: (idx: number) => void;
  skewAmount?: number;
  easing?: EasingType;
  children: ReactNode;
}

type CardLikeElement = ReactElement<
  CardProps & {
    style?: CSSProperties;
    onClick?: (e: MouseEvent) => void;
  } & RefAttributes<HTMLDivElement>
>;

const makeSlot = (i: number, distX: number, distY: number, total: number): Slot => ({
  x: i * distX,
  y: -i * distY,
  z: -i * distX * 1.5,
  zIndex: total - i,
});

const placeNow = (el: HTMLDivElement | null, slot: Slot, skew: number) => {
  if (!el) return;

  gsap.set(el, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  });
};

export default function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  autoPlay = true,
  manualSwapTick,
  manualSwapDirection = 1,
  bringToFrontOnClick = false,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children,
}: CardSwapProps) {
  const config = useMemo(
    () =>
      easing === 'elastic'
        ? {
            ease: 'elastic.out(0.6,0.9)',
            durDrop: 2,
            durMove: 2,
            durReturn: 2,
            promoteOverlap: 0.9,
            returnDelay: 0.05,
          }
        : {
            ease: 'power1.inOut',
            durDrop: 0.45,
            durMove: 0.45,
            durReturn: 0.45,
            promoteOverlap: 0.55,
            returnDelay: 0.08,
          },
    [easing],
  );

  const childArr = useMemo(() => Children.toArray(children), [children]);
  const refs = useMemo<RefObject<HTMLDivElement | null>[]>(
    () => childArr.map(() => createRef<HTMLDivElement>()),
    // Keep refs stable across re-renders; only recreate when card count changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [childArr.length],
  );

  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i));
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const intervalRef = useRef<number | null>(null);
  const container = useRef<HTMLDivElement | null>(null);
  const isHoveredRef = useRef(false);
  const swapRef = useRef<(direction: 1 | -1) => void>(() => {});
  const lastManualSwapTickRef = useRef<number | null>(null);
  const bringToFrontRef = useRef<(idx: number) => void>(() => {});

  useEffect(() => {
    const total = refs.length;
    const placeAllToOrder = () => {
      order.current.forEach((idx, i) => {
        const el = refs[idx]?.current;
        placeNow(el, makeSlot(i, cardDistance, verticalDistance, total), skewAmount);
      });
    };

    placeAllToOrder();

    const swap = (direction: 1 | -1) => {
      if (isHoveredRef.current) return;
      if (order.current.length < 2) return;

      const tl = gsap.timeline();
      tlRef.current = tl;

      if (direction === 1) {
        const [front, ...rest] = order.current;
        const elFront = refs[front]?.current;
        if (!elFront) return;

        tl.to(elFront, {
          y: '+=500',
          duration: config.durDrop,
          ease: config.ease,
        });

        tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
        rest.forEach((idx, i) => {
          const el = refs[idx]?.current;
          if (!el) return;
          const slot = makeSlot(i, cardDistance, verticalDistance, refs.length);

          tl.set(el, { zIndex: slot.zIndex }, 'promote');
          tl.to(
            el,
            {
              x: slot.x,
              y: slot.y,
              z: slot.z,
              duration: config.durMove,
              ease: config.ease,
            },
            `promote+=${i * 0.15}`,
          );
        });

        const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length);
        tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);

        tl.call(
          () => {
            gsap.set(elFront, { zIndex: backSlot.zIndex });
          },
          undefined,
          'return',
        );

        tl.to(
          elFront,
          {
            x: backSlot.x,
            y: backSlot.y,
            z: backSlot.z,
            duration: config.durReturn,
            ease: config.ease,
          },
          'return',
        );

        tl.call(() => {
          order.current = [...rest, front];
        });
      } else {
        const back = order.current[order.current.length - 1];
        const rest = order.current.slice(0, -1);
        const elBack = refs[back]?.current;
        if (!elBack) return;

        tl.to(elBack, {
          y: '+=500',
          duration: config.durDrop,
          ease: config.ease,
        });

        tl.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`);
        rest.forEach((idx, i) => {
          const el = refs[idx]?.current;
          if (!el) return;
          const slot = makeSlot(i + 1, cardDistance, verticalDistance, refs.length);

          tl.set(el, { zIndex: slot.zIndex }, 'promote');
          tl.to(
            el,
            {
              x: slot.x,
              y: slot.y,
              z: slot.z,
              duration: config.durMove,
              ease: config.ease,
            },
            `promote+=${i * 0.15}`,
          );
        });

        const frontSlot = makeSlot(0, cardDistance, verticalDistance, refs.length);
        tl.addLabel('return', `promote+=${config.durMove * config.returnDelay}`);

        tl.call(
          () => {
            gsap.set(elBack, { zIndex: frontSlot.zIndex });
          },
          undefined,
          'return',
        );

        tl.to(
          elBack,
          {
            x: frontSlot.x,
            y: frontSlot.y,
            z: frontSlot.z,
            duration: config.durReturn,
            ease: config.ease,
          },
          'return',
        );

        tl.call(() => {
          order.current = [back, ...rest];
        });
      }
    };

    swapRef.current = swap;

    const bringToFront = (cardIndex: number) => {
      const position = order.current.indexOf(cardIndex);
      if (position <= 0) return;

      if (tlRef.current) {
        tlRef.current.progress(1);
        tlRef.current.kill();
        tlRef.current = null;
      }

      const nextOrder = [cardIndex, ...order.current.filter((idx) => idx !== cardIndex)];
      const tl = gsap.timeline();
      tlRef.current = tl;

      nextOrder.forEach((idx, slotIndex) => {
        const el = refs[idx]?.current;
        if (!el) return;

        const slot = makeSlot(slotIndex, cardDistance, verticalDistance, refs.length);
        tl.set(el, { zIndex: slot.zIndex }, 0);
        tl.to(
          el,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: 0.35,
            ease: config.ease,
          },
          0,
        );
      });

      tl.call(() => {
        order.current = nextOrder;
      });
    };

    bringToFrontRef.current = bringToFront;

    order.current = Array.from({ length: childArr.length }, (_, i) => i);

    if (autoPlay) {
      swap(1);
      intervalRef.current = window.setInterval(() => swap(1), delay);
    }

    if (pauseOnHover) {
      const node = container.current;
      if (!node) return undefined;

      const pause = () => {
        isHoveredRef.current = true;
        if (tlRef.current) {
          tlRef.current.progress(1);
          tlRef.current.kill();
          tlRef.current = null;
        }
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        placeAllToOrder();
      };

      const resume = () => {
        isHoveredRef.current = false;
        if (autoPlay) {
          intervalRef.current = window.setInterval(() => swap(1), delay);
        }
      };

      node.addEventListener('mouseenter', pause);
      node.addEventListener('mouseleave', resume);

      return () => {
        node.removeEventListener('mouseenter', pause);
        node.removeEventListener('mouseleave', resume);
        if (intervalRef.current) clearInterval(intervalRef.current);
        tlRef.current?.kill();
      };
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      tlRef.current?.kill();
    };
  }, [
    cardDistance,
    verticalDistance,
    delay,
    autoPlay,
    pauseOnHover,
    skewAmount,
    childArr.length,
    refs,
    config,
  ]);

  useEffect(() => {
    if (autoPlay || manualSwapTick === undefined) return;

    if (lastManualSwapTickRef.current === null) {
      lastManualSwapTickRef.current = manualSwapTick;
      return;
    }

    if (lastManualSwapTickRef.current === manualSwapTick) return;
    lastManualSwapTickRef.current = manualSwapTick;

    if (isHoveredRef.current) return;
    swapRef.current(manualSwapDirection);
  }, [autoPlay, manualSwapTick, manualSwapDirection]);

  const rendered = childArr.map((child, i) => {
    if (!isValidElement(child)) return child;
    const typedChild = child as CardLikeElement;
    const childProps = typedChild.props;

    return cloneElement(typedChild, {
      key: i,
      ref: refs[i],
      style: { width, height, ...(childProps.style ?? {}) },
      onClick: (e: MouseEvent) => {
        if (bringToFrontOnClick) {
          bringToFrontRef.current(i);
        }
        childProps.onClick?.(e);
        onCardClick?.(i);
      },
    });
  });

  return (
    <div ref={container} className="card-swap-container" style={{ width, height }}>
      {rendered}
    </div>
  );
}
