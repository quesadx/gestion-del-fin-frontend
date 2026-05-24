import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, Toast } from '../store/toast';
import { setToastApi } from '../lib/toast';

const iconMap: Record<Toast['type'], typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const colorMap: Record<Toast['type'], string> = {
  success: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-400',
  error: 'border-red-500/50 bg-red-950/30 text-red-400',
  info: 'border-blue-500/50 bg-blue-950/30 text-blue-400',
  warning: 'border-amber-500/50 bg-amber-950/30 text-amber-400',
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);
  const addToast = useToastStore((s) => s.addToast);

  useEffect(() => {
    setToastApi(addToast);
    return () => setToastApi(null);
  }, [addToast]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className={`pointer-events-auto brutalist-border rounded-lg px-4 py-3 flex items-start gap-3 shadow-2xl backdrop-blur-sm ${colorMap[toast.type]}`}
            >
              <Icon size={18} className="shrink-0 mt-0.5" />
              <p className="text-xs font-mono flex-1 leading-relaxed">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
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
