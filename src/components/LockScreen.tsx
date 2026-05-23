import { useState, type FormEvent } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { authApi } from '@/features/auth/api/auth.api';
import { toast } from '@/shared/lib/toast';

export function LockScreen() {
  const user = useAuthStore((state) => state.user);
  const isLocked = useAuthStore((state) => state.isLocked);
  const unlock = useAuthStore((state) => state.unlock);
  const updateActivity = useAuthStore((state) => state.updateActivity);

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !user) return;

    setLoading(true);
    try {
      await authApi.login({ username: user.username, password });
      unlock();
      updateActivity();
      setPassword('');
    } catch {
      toast('Invalid password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center">
      <div className="brutalist-border bg-surface-raised p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-brand-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white font-mono-data tracking-wider">
            SESSION LOCKED
          </h2>
          <p className="text-zinc-400 text-sm mt-2">Enter your password to unlock</p>
          {user && <p className="text-zinc-500 text-xs mt-1 font-mono-data">{user.username}</p>}
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
            className="w-full bg-surface-overlay border border-zinc-700 text-white px-3 py-2 font-mono-data text-sm focus:outline-none focus:border-brand-primary disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full bg-brand-primary text-white py-2 font-mono-data text-sm tracking-wider hover:bg-red-600 disabled:opacity-50 transition-colors"
          >
            {loading ? 'UNLOCKING...' : 'UNLOCK'}
          </button>
        </form>
      </div>
    </div>
  );
}
