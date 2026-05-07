import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { authApi } from '../api/auth.api';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  const fullTitle = 'AUTHENTICATION REQUIRED';
  const [displayedTitle, setDisplayedTitle] = useState('');

  const playTickSound = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  };

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx += 1;
      setDisplayedTitle(fullTitle.substring(0, currentIdx));
      playTickSound();

      if (currentIdx >= fullTitle.length) {
        clearInterval(interval);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const loginScale = useMemo(() => {
    const widthScale = (viewport.width - 40) / 660;
    const heightScale = (viewport.height - 60) / 320;
    return Math.max(0.5, Math.min(1, widthScale, heightScale));
  }, [viewport.height, viewport.width]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      login(response.token, {
        id: response.user.id,
        username: response.user.username,
        role: response.user.role,
        campId: response.user.campId,
      });
      useAuthStore.setState({ isHydrated: true });
      setTimeout(() => navigate('/dashboard'), 50);
    } catch {
      setError('Login failed. Check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="col-span-2 w-full h-full min-h-0 flex items-center justify-center overflow-visible bg-transparent font-['VT323'] px-2 py-2 sm:px-4 sm:py-4">
      <div
        className="relative w-[660px] max-w-[calc(100vw-1rem)] origin-center border border-green-dim/30 bg-bg-panel/40 backdrop-blur-sm"
        style={{ transform: `scale(${loginScale})` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-green-hi opacity-70"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-green-hi opacity-70"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-green-hi opacity-70"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-green-hi opacity-70"></div>
        </div>

        <div className="flex flex-col items-center px-4 py-5 sm:px-8 sm:py-7">
          <div className="mb-4 h-6 overflow-hidden text-center text-xs sm:text-2xl tracking-[0.25em] text-green-hi whitespace-nowrap">
            <span className="mr-2 text-xs sm:text-lg inline-block">▌</span>
            {displayedTitle}
          </div>

          <form
            onSubmit={handleLogin}
            className="flex w-full flex-col gap-3 sm:gap-4 tracking-widest"
          >
            <div>
              <label className="mb-1 flex items-center text-xs sm:text-lg text-green-base">
                <span className="mr-2 text-[10px] sm:text-sm opacity-80">▶</span> OPERATOR ID
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="pip-input uppercase"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center text-xs sm:text-lg text-green-base">
                <span className="mr-2 text-[10px] sm:text-sm opacity-80">▶</span> ACCESS CODE
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pip-input tracking-[0.35em]"
              />
            </div>

            {error && (
              <div className="text-center text-xs sm:text-base animate-pulse text-warn-text">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex min-h-[34px] w-full flex-shrink-0 items-center justify-center border border-green-dim/80 px-2 py-1 text-xs sm:text-lg tracking-[0.2em] text-green-hi transition-colors hover:bg-green-hi hover:text-black focus:bg-green-hi focus:text-black outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="mr-2 sm:mr-3 text-[10px] sm:text-sm">▶</span>{' '}
              {loading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
