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
    border: 'border-gdf-status-danger/30',
    bg: 'bg-gdf-glass-bg-heavy backdrop-blur-glass-heavy',
    text: 'text-gdf-status-danger',
    icon: AlertTriangle,
  },
  success: {
    border: 'border-gdf-accent-secondary/30',
    bg: 'bg-gdf-glass-bg-heavy backdrop-blur-glass-heavy',
    text: 'text-gdf-accent-secondary',
    icon: CheckCircle,
  },
  info: {
    border: 'border-gdf-accent-primary/30',
    bg: 'bg-gdf-glass-bg-heavy backdrop-blur-glass-heavy',
    text: 'text-gdf-accent-primary',
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
              className={`pointer-events-auto border rounded-md px-4 py-3 flex items-start gap-3 shadow-lg ${style.border} ${style.bg}`}
            >
              <Icon size={16} className={`mt-0.5 shrink-0 ${style.text}`} />
              <p className="text-xs font-mono-data text-gdf-text-primary flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-gdf-text-muted hover:text-gdf-text-primary shrink-0 transition-colors"
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
