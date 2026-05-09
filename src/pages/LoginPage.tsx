import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';

const loginSchema = z.object({
  username: z.string().min(3, 'Minimum 3 characters required'),
  password: z.string().min(8, 'Minimum 8 characters required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const isLoading = mutation.isPending;
  const authError = useMemo(
    () => (mutation.error instanceof Error ? mutation.error.message : ''),
    [mutation.error],
  );

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    await mutation.mutateAsync(values);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-surface-base">
      {/* Ambient background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[15%] w-[70vw] h-[70vw] opacity-20"
          style={{
            background: 'radial-gradient(circle, oklch(0.65 0.28 210 / 0.3), transparent 60%)',
            filter: 'blur(100px)',
            animation: 'drift 20s ease-in-out infinite alternate',
          }}
        />
        <div className="absolute -bottom-[25%] -right-[12%] w-[65vw] h-[65vw] opacity-15"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.25 280 / 0.3), transparent 60%)',
            filter: 'blur(110px)',
            animation: 'drift 25s ease-in-out infinite alternate-reverse',
          }}
        />
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 20%, oklch(0.05 0.01 255 / 0.6) 100%)',
          }}
        />
      </div>

      <div className="grid-overlay" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in">
        <div className="glass-heavy rounded-none border border-border/25 p-8">
          {/* Header */}
          <div className="text-center mb-8 space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 glass-light border border-border/30 mb-2">
              <span className="w-2 h-2 bg-accent-primary animate-pulse-glow" style={{ boxShadow: '0 0 10px var(--accent-primary)' }} />
            </div>
            <h1 className="font-sans text-sm font-extrabold tracking-[0.25em] text-accent-primary"
              style={{ textShadow: '0 0 16px var(--accent-primary)' }}>
              GESTION DEL FIN
            </h1>
            <span className="block font-mono-sm text-text-muted">
              TERMINAL v2.0 · AUTHENTICATION REQUIRED
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label className="block mb-2 font-mono-sm tracking-[0.12em] uppercase text-text-muted">
                Operator ID
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="Enter your operator ID"
                className="terminal-input"
              />
              {errors.username && (
                <p className="mt-1.5 font-mono-sm text-status-red animate-slide-up">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 font-mono-sm tracking-[0.12em] uppercase text-text-muted">
                Cipher Key
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your cipher key"
                className="terminal-input"
              />
              {errors.password && (
                <p className="mt-1.5 font-mono-sm text-status-red animate-slide-up">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {authError && (
              <div className="rounded-none border border-status-red/25 bg-status-red/5 p-3 font-mono-sm text-status-red animate-slide-up">
                AUTH_FAILURE: {authError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-none font-mono text-xs tracking-[0.15em] uppercase font-bold px-5 py-3 bg-accent-primary text-surface-base border border-accent-primary/30 hover:shadow-glow active:opacity-80 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE'}
            </button>

            {/* Footer */}
            <div className="pt-4 border-t border-border/10 flex items-center justify-between font-mono-sm text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1 h-1 bg-status-green animate-blink" />
                ENC: AES-256
              </span>
              <span>SEC_LEVEL: 02</span>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center font-mono-sm text-text-muted/40 tracking-[0.1em]">
          UNAUTHORIZED ACCESS WILL BE PROSECUTED
        </p>
      </div>
    </div>
  );
}
