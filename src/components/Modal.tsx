import { ReactNode, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import BorderGlow from './BorderGlow';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  size = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        dialogRef.current
          ?.querySelector<HTMLElement>('button, input, select, textarea, [href]')
          ?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, handleEscape, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title || subtitle || 'Dialog'}
          onClick={onClose}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Panel */}
          <motion.div
            ref={dialogRef}
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <BorderGlow
              className={cn('w-full max-h-[90vh] overflow-hidden', sizeMap[size], className)}
              backgroundColor="#1b0b0c"
              borderRadius={16}
              glowColor="356 78 62"
              glowIntensity={0.9}
              glowRadius={28}
              edgeSensitivity={22}
              coneSpread={18}
              animated={false}
            >
              <div className="relative bg-transparent p-4 sm:p-6 md:p-8 w-full space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
                {(title || subtitle) && (
                  <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
                    <div>
                      {subtitle && (
                        <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                          {subtitle}
                        </p>
                      )}
                      {title && (
                        <h2 className="text-xl sm:text-2xl font-black uppercase italic tracking-tighter">
                          {title}
                        </h2>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      aria-label="Close dialog"
                      className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 -m-1 touch-target"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                {children}
              </div>
            </BorderGlow>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
