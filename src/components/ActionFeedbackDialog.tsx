import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

export type ActionFeedbackType = 'success' | 'error' | 'warning';

const feedbackStyles: Record<
  ActionFeedbackType,
  {
    icon: typeof CheckCircle2;
    border: string;
    text: string;
    button: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    border: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400',
    text: 'text-emerald-400',
    button: 'bg-emerald-500 hover:bg-emerald-400',
  },
  error: {
    icon: XCircle,
    border: 'border-red-500/40 bg-red-950/20 text-red-400',
    text: 'text-red-400',
    button: 'bg-brand-primary hover:bg-brand-primary/90',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-amber-500/40 bg-amber-950/20 text-amber-400',
    text: 'text-amber-400',
    button: 'bg-brand-secondary hover:bg-amber-400',
  },
};

interface ActionFeedbackDialogProps {
  isOpen: boolean;
  type: ActionFeedbackType;
  eyebrow?: string;
  title: string;
  message: string;
  actionLabel?: string;
  onClose: () => void;
}

export function ActionFeedbackDialog({
  isOpen,
  type,
  eyebrow = 'SYSTEM MESSAGE',
  title,
  message,
  actionLabel = 'ACKNOWLEDGE',
  onClose,
}: ActionFeedbackDialogProps) {
  const style = feedbackStyles[type];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="bg-surface-raised brutalist-border p-5 sm:p-7 rounded-xl max-w-md w-full space-y-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={cn(
                'mx-auto flex h-14 w-14 items-center justify-center rounded-xl border',
                style.border,
              )}
            >
              <Icon size={28} />
            </div>
            <div className="space-y-2">
              <p className={cn('text-[10px] font-mono uppercase tracking-widest', style.text)}>
                {eyebrow}
              </p>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter">{title}</h3>
              <p className="text-xs font-mono leading-relaxed text-zinc-400">{message}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'w-full rounded px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-colors',
                style.button,
              )}
            >
              {actionLabel}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
