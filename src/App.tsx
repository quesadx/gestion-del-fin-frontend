import { useState, useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/features/auth/auth-context';
import { AppRoutes } from '@/routes/AppRoutes';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { ToastContainer } from '@/shared/lib/toast';
import { queryClient } from '@/shared/lib/queryClient';
import { useServerTime } from '@/features/system/hooks/useServerTime';

function ServerTimeSync() {
  useServerTime();
  return null;
}

export function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return <ScreenLoader />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ServerTimeSync />
        <AppRoutes />
      </AuthProvider>
      <ToastContainer />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
