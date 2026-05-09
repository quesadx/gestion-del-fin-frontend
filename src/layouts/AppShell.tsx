import { useCallback, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/useAuth';
import { useNavItems } from '@/hooks/useNavItems';
import { Sidebar } from '@/components/navigation/Sidebar';
import { Navbar } from '@/components/navigation/Navbar';
import { WaveBackground } from '@/components/cyber/WaveBackground';

export function AppShell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role, logout } = useAuth();
  const items = useNavItems(role);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = useCallback(async () => {
    await logout();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [logout, queryClient, navigate]);

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-foreground">
      <WaveBackground />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          items={items}
          isOpen={isSidebarOpen}
          isCollapsed={isCollapsed}
          onClose={() => setIsSidebarOpen(false)}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            userName={user?.username}
            onLogout={handleLogout}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          />
          <main className="flex-1 px-4 py-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
