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

type Pending401Entry = {
  resolve: () => void;
  reject: (error: unknown) => void;
};

let pending401Queue: Pending401Entry[] | null = null;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401) {
      const { token } = useAuthStore.getState();

      if (!token) {
        return Promise.reject(error);
      }

      if (pending401Queue) {
        return new Promise<void>((resolve, reject) => {
          pending401Queue!.push({ resolve, reject });
        }).then(() => Promise.reject(error));
      }

      pending401Queue = [];
      useAuthStore.getState().logout();

      if (navigationRef.current) {
        navigationRef.current('/login', { replace: true });
      } else if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      setTimeout(() => {
        const queue = pending401Queue;
        pending401Queue = null;
        queue?.forEach(({ resolve }) => resolve());
      }, 100);
    }

    return Promise.reject(error);
  },
);
