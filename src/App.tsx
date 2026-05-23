import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/features/auth/auth-context';
import { AppRoutes } from '@/routes/AppRoutes';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { TacticalBackground } from '@/components/tactical/TacticalBackground';
import { ThemeToggle } from '@/components/tactical/ThemeToggle';
import { ToastContainer } from '@/shared/lib/toast';
import { queryClient } from '@/shared/lib/queryClient';
import { useServerTime } from '@/features/system/hooks/useServerTime';
import { useAuthStore } from '@/features/auth/store/auth.store';

function ServerTimeSync() {
  useServerTime();
  return null;
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const hasHydrated = useAuthStore((state) => state._hasHydrated);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (hasHydrated && !token) {
      const style = document.getElementById('spa-preload')?.style;
      if (style) style.display = 'none';
    }
  }, [hasHydrated, token]);

  if (!hasHydrated) {
    return <ScreenLoader />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TacticalBackground />
      <ThemeToggle />
      <AuthProvider>
        <AppBootstrap>
          <ServerTimeSync />
          <AppRoutes />
        </AppBootstrap>
      </AuthProvider>
      <ToastContainer />
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
