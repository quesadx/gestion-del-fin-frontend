import { ReactNode, useEffect, useCallback } from 'react';
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
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
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
              <div className="relative bg-transparent p-6 md:p-8 w-full space-y-6 max-h-[90vh] overflow-y-auto">
                {(title || subtitle) && (
                  <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
                    <div>
                      {subtitle && (
                        <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                          {subtitle}
                        </p>
                      )}
                      {title && (
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                          {title}
                        </h3>
                      )}
                    </div>
                    <button
                      onClick={onClose}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors p-1 -m-1"
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
