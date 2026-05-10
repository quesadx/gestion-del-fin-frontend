import axios from 'axios';
import type { NavigateFunction } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/auth.store';

export const navigationRef: { current: NavigateFunction | null } = { current: null };

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isHandling401 = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      const { token } = useAuthStore.getState();

      if (token && !isHandling401) {
        isHandling401 = true;
        useAuthStore.getState().logout();

        if (navigationRef.current) {
          navigationRef.current('/login', { replace: true });
        } else if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        setTimeout(() => {
          isHandling401 = false;
        }, 2000);
      }
    }

    return Promise.reject(error);
  },
);
