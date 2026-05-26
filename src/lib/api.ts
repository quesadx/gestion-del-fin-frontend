import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { useConnectionStore } from '../store/connection';
import { showToast } from '../lib/toast';
import { useDeniedPermissionsStore } from '../store/deniedPermissions';

/**
 * Single Axios instance for the entire app.
 * All requests go through the Express proxy at /api-remote/* which forwards
 * to the Railway production backend — eliminating any CORS issues.
 */
export const apiClient = axios.create();

// ── Request interceptor ──────────────────────────────────────────────────────

apiClient.interceptors.request.use((config) => {
  config.baseURL = '/api-remote';

  // Read the token directly from the Zustand store (persisted to localStorage
  // by Zustand's persist middleware). Avoids duplicating the raw localStorage key.
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────

apiClient.interceptors.response.use(
  (response) => {
    // Any successful response confirms we can reach the server.
    // The ping hook will overwrite with a measured latency; here we just flip
    // the status without touching the latencyMs value.
    useConnectionStore.getState().setConnected();
    return response;
  },
  (error) => {
    if (!error.response) {
      // No response at all — network is unreachable or server is down.
      useConnectionStore.getState().setDisconnected();
    }

    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (error.response?.status === 403) {
      const permHint =
        (error.response?.data as { permission?: string })?.permission ??
        (error.response?.data as { required_permission?: string })?.required_permission;
      if (permHint) {
        useDeniedPermissionsStore.getState().markDenied(permHint);
      }
      if (error.config?.method !== 'get') {
        const msg =
          error.response?.data?.error?.message ??
          error.response?.data?.message ??
          'You do not have permission to perform this action.';
        showToast.error(typeof msg === 'string' ? msg : 'Forbidden');
      }
    }

    return Promise.reject(error);
  },
);

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely unwrap paginated API responses: `{ data: T[], pagination: {...} }`.
 * Also handles plain arrays for local mock compatibility.
 */
export const unwrapList = <T>(responseData: unknown): T[] => {
  if (Array.isArray(responseData)) return responseData as T[];
  if (
    responseData &&
    typeof responseData === 'object' &&
    Array.isArray((responseData as Record<string, unknown>).data)
  ) {
    return (responseData as { data: T[] }).data;
  }
  return [];
};

/**
 * Convert a plain-object payload into `FormData` for multipart endpoints
 * (e.g. person update, admission create). Skips null/undefined/empty-string values.
 */
export const toFormData = (
  values: Record<string, string | number | boolean | Blob | null | undefined>,
): FormData => {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value == null || value === '') continue;
    fd.append(key, value instanceof Blob ? value : String(value));
  }
  return fd;
};
