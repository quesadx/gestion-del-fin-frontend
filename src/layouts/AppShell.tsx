import { useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useNavItems } from '@/hooks/useNavItems';
import { DockBar } from '@/components/navigation/DockBar';

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuth();
  const role = useAuthStore((state) => state.role);
  const items = useNavItems(role);

  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [logout, queryClient, navigate]);

  return (
    <div className="relative min-h-screen bg-surface-base text-text-primary">
      {/* Ambient background blobs */}
      <div className="fixed inset-0 -z-20 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-none opacity-25"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.28 210 / 0.3), transparent 60%)',
            filter: 'blur(120px)',
            animation: 'drift 25s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] rounded-none opacity-20"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.25 280 / 0.3), transparent 60%)',
            filter: 'blur(130px)',
            animation: 'drift 30s ease-in-out infinite alternate-reverse',
          }}
        />
      </div>

      {/* Subtle grid overlay */}
      <div className="grid-overlay" />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Top status bar — thin, informational */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/20 bg-surface-deep/60 backdrop-blur-heavy px-6 py-2">
          <div className="flex items-center gap-3 font-mono-sm text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-status-green shadow-[0_0_6px_#00e676] animate-pulse-glow" />
              <span className="tracking-[0.15em] text-text-secondary">END MANAGEMENT</span>
            </span>
            <span className="text-border/40">|</span>
            <span className="tracking-wider">TERMINAL v2.0</span>
          </div>

          <div className="flex items-center gap-4 font-mono-sm text-text-muted">
            {user?.username && (
              <span className="flex items-center gap-2">
                <span className="text-border/40">OP:</span>
                <span className="text-text-secondary tracking-wide">
                  {user.username.toUpperCase()}
                </span>
              </span>
            )}
            <span className="text-border/40">|</span>
            <span className="text-status-green tracking-wider">ONLINE</span>
          </div>
        </header>

        {/* Main content — centered, max-width, with padding for dock */}
        <main className="flex-1 px-6 py-8 pb-24">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        {/* Floating bottom dock */}
        <DockBar items={items} userName={user?.username} onLogout={handleLogout} />
      </div>
    </div>
  );
}
