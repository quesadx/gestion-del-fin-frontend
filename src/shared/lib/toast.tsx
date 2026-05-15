/* eslint-disable react-refresh/only-export-components */
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

type ToastType = 'error' | 'success' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  toast: (message: string, type?: ToastType) => void;
  dismiss: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  toast: (message, type = 'error') => {
    const id = String(++toastId);
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type: ToastType = 'error') {
  useToastStore.getState().toast(message, type);
}

const typeStyles: Record<
  ToastType,
  { border: string; bg: string; text: string; icon: typeof AlertTriangle }
> = {
  error: {
    border: 'border-[var(--neon-fuchsia)]/30',
    bg: 'bg-[oklch(0.12_0.05_340_/_0.95)]',
    text: 'text-[var(--neon-fuchsia)]',
    icon: AlertTriangle,
  },
  success: {
    border: 'border-[var(--neon-cyan)]/30',
    bg: 'bg-[oklch(0.12_0.05_210_/_0.95)]',
    text: 'text-[var(--neon-cyan)]',
    icon: CheckCircle,
  },
  info: {
    border: 'border-[var(--neon-violet)]/30',
    bg: 'bg-[oklch(0.12_0.05_280_/_0.95)]',
    text: 'text-[var(--neon-violet)]',
    icon: Info,
  },
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const style = typeStyles[t.type];
          const Icon = style.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className={`pointer-events-auto border backdrop-blur-md rounded-sm px-4 py-3 flex items-start gap-3 shadow-lg ${style.border} ${style.bg}`}
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${style.text}`} />
              <p className="text-xs font-mono-data text-foreground flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
