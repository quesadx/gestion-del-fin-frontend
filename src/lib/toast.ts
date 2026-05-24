import { ToastType } from '../store/toast';

let _addToast: ((toast: { type: ToastType; message: string; duration?: number }) => string) | null =
  null;

export function setToastApi(api: typeof _addToast) {
  _addToast = api;
}

function toast(type: ToastType, message: string, duration?: number) {
  if (!_addToast) {
    console.warn('[toast] Toast API not initialized. Call setToastApi first.');
    return '';
  }
  return _addToast({ type, message, duration });
}

export const showToast = {
  success: (message: string, duration?: number) => toast('success', message, duration),
  error: (message: string, duration?: number) => toast('error', message, duration ?? 6000),
  info: (message: string, duration?: number) => toast('info', message, duration),
  warning: (message: string, duration?: number) => toast('warning', message, duration ?? 5000),
};
