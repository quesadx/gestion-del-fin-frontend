import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import BorderGlow from './BorderGlow';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'CONFIRM',
  cancelLabel = 'CANCEL',
  variant = 'danger',
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const isDanger = variant === 'danger';

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          aria-describedby="confirm-dialog-description"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <BorderGlow
              className="max-w-sm w-full"
              backgroundColor="#1b0b0c"
              borderRadius={16}
              glowColor={isDanger ? '356 82 60' : '36 88 58'}
              glowIntensity={0.95}
              glowRadius={28}
              edgeSensitivity={20}
              coneSpread={18}
              animated={false}
            >
              <div className="p-6 space-y-5">
                {/* Icon + title */}
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'p-2 rounded-lg shrink-0',
                      isDanger ? 'bg-red-950/30 text-red-500' : 'bg-amber-950/30 text-amber-500',
                    )}
                  >
                    <AlertTriangle size={20} />
                  </div>
                  <div className="space-y-1 pt-0.5">
                    <h3 className="font-black uppercase tracking-tight text-sm text-white">
                      {title}
                    </h3>
                    <p
                      id="confirm-dialog-description"
                      className="text-xs text-zinc-400 leading-relaxed font-mono"
                    >
                      {description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={onCancel}
                    disabled={isPending}
                    className="flex-1 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase disabled:opacity-40"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    onClick={onConfirm}
                    disabled={isPending}
                    className={cn(
                      'flex-1 py-2 text-xs font-black uppercase rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-40',
                      isDanger
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-amber-500 hover:bg-amber-400 text-black',
                    )}
                  >
                    {isPending ? <Loader2 size={14} className="animate-spin" /> : confirmLabel}
                  </button>
                </div>
              </div>
            </BorderGlow>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
