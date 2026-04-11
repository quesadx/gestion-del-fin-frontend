import axios from "axios";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { useCampStore } from "@/features/camps/store/camp.store";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api",
  timeout: 10_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  const campId = useCampStore.getState().activeCamp?.id;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (campId) {
    config.headers["X-Camp-Id"] = campId;
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);
