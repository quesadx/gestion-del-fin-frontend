import { showToast } from './toast';

type ApiErrorPayload = {
  error?: { message?: unknown };
  message?: unknown;
};

type ApiLikeError = {
  response?: {
    status?: number;
    data?: ApiErrorPayload;
  };
};

export function getApiErrorMessage(error: unknown, fallback: string) {
  const payload = (error as ApiLikeError).response?.data;
  const nestedMessage = payload?.error?.message;
  const message = payload?.message;

  if (typeof nestedMessage === 'string' && nestedMessage.trim()) return nestedMessage;
  if (typeof message === 'string' && message.trim()) return message;

  return fallback;
}

export function showMutationError(error: unknown, fallback: string) {
  const status = (error as ApiLikeError).response?.status;

  if (status === 401 || status === 403) return;

  showToast.error(getApiErrorMessage(error, fallback));
}
