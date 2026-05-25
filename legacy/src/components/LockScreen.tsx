import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authApi } from '@/features/auth/api/auth.api';
import { toast } from '@/shared/lib/toast';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { TacticalButton } from '@/components/tactical/TacticalButton';

export function LockScreen() {
  const user = useAuthStore((state) => state.user);
  const isLocked = useAuthStore((state) => state.isLocked);
  const unlock = useAuthStore((state) => state.unlock);
  const updateActivity = useAuthStore((state) => state.updateActivity);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !user) return;

    setLoading(true);
    setError(null);
    try {
      await authApi.login({ username: user.username, password });
      unlock();
      updateActivity();
      setPassword('');
    } catch {
      setError('Invalid password');
      toast('Invalid password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gdf-surface-root/80 backdrop-blur-sm flex items-center justify-center">
      <GlassPanel variant="heavy" bracketed accent="cyan" className="w-full max-w-sm p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gdf-accent-primary flex items-center justify-center mx-auto mb-4">
            <span className="font-mono font-bold text-xs text-gdf-text-inverse">GF</span>
          </div>
          <h2 className="text-lg font-semibold text-gdf-text-primary font-mono-data tracking-wider">
            SESSION LOCKED
          </h2>
          <p className="text-gdf-text-muted text-sm mt-2">Enter your password to unlock</p>
          {user && (
            <p className="font-mono-data text-xs text-gdf-accent-primary mt-1">
              USER: {user.username.toUpperCase()}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            autoComplete="current-password"
            disabled={loading}
            className="w-full bg-gdf-surface-base border border-gdf-border-subtle text-gdf-text-primary px-3 py-2 font-mono-data text-sm focus:outline-none focus:border-gdf-accent-primary focus:ring-1 focus:ring-gdf-accent-primary/20 disabled:opacity-50 rounded-md"
          />

          {error && <p className="text-gdf-status-danger text-xs font-mono-data">{error}</p>}

          <TacticalButton
            variant="primary"
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full"
          >
            {loading ? 'UNLOCKING...' : 'UNLOCK'}
          </TacticalButton>
        </form>
      </GlassPanel>
    </div>
  );
}
