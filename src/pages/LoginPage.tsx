import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WaveBackground } from '@/components/cyber/WaveBackground';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { Lock, User, Zap } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';

const loginSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
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
  const status = isLoading ? 'AUTHENTICATING' : 'AWAITING';
  const submitLabel = isLoading ? 'AUTHENTICATING...' : 'JACK_IN';
  const loginSuccess = mutation.isSuccess;
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
    <div className="relative min-h-screen flex items-center justify-center px-6 py-10 text-foreground">
      <WaveBackground />

      {/* Decorative scanline — full screen overlay from canvas handles this */}

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-[var(--neon-fuchsia)] bg-[var(--neon-fuchsia)] shadow-[0_0_12px_var(--neon-fuchsia)]">
            <Zap className="h-5 w-5 text-[var(--charcoal)]" strokeWidth={3} />
          </div>
          <div className="text-center space-y-1">
            <h1 className="font-display text-sm font-black tracking-[0.35em] text-glow-fuchsia leading-none">
              GESTION DEL FIN
            </h1>
            <span className="block text-[10px] tracking-[0.25em] text-[var(--neon-cyan)]/60 font-mono-data">
              v1.0.0 · SURVIVAL TERMINAL
            </span>
          </div>
        </div>

        <Panel title="JACK_IN" tag="AUTH.01" status={status} accent="fuchsia">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                OPERATOR_ID //
              </label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neon-cyan)]/50 group-focus-within:text-[var(--neon-cyan)] transition-colors duration-200" />
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder="V.SILVERHAND"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] pl-9 pr-3 py-2.5 text-sm text-[var(--neon-fuchsia)] placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data focus:shadow-[inset_0_0_12px_oklch(0.68_0.32_340_/_0.06)]"
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data animate-slide-up">
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                CIPHER_KEY //
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--neon-cyan)]/50 group-focus-within:text-[var(--neon-cyan)] transition-colors duration-200" />
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="**********"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] pl-9 pr-3 py-2.5 text-sm text-[var(--neon-cyan)] placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data focus:shadow-[inset_0_0_12px_oklch(0.85_0.22_200_/_0.06)]"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data animate-slide-up">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error / success */}
            {authError ? (
              <div className="rounded-sm bg-[oklch(0.08_0.05_320_/_0.7)] border border-[var(--neon-yellow)]/50 p-3 text-[10px] text-[var(--neon-yellow)] font-mono-data animate-slide-up">
                ⚠ {authError}
              </div>
            ) : null}

            {loginSuccess ? (
              <div className="rounded-sm bg-[oklch(0.08_0.05_160_/_0.7)] border border-[var(--neon-cyan)]/50 p-3 text-[10px] text-[var(--neon-cyan)] font-mono-data animate-slide-up">
                ✓ ACCESS GRANTED. SESSION INITIALIZED.
              </div>
            ) : null}

            {/* Options row */}
            <div className="flex items-center justify-between font-mono-data text-[10px]">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer hover:text-[var(--neon-cyan)] transition-colors duration-150">
                <input type="checkbox" className="accent-[var(--neon-fuchsia)] rounded-sm" />
                PERSIST_SESSION
              </label>
              <a
                href="#"
                className="text-muted-foreground hover:text-[var(--neon-cyan)] transition-colors duration-150 tracking-widest"
              >
                RESET_KEY?
              </a>
            </div>

            {/* Buttons */}
            <div className="pt-1 flex flex-col gap-2.5">
              <GlitchButton
                variant="warning"
                type="submit"
                disabled={isLoading}
                className="w-full justify-center"
              >
                {submitLabel}
              </GlitchButton>
              <GlitchButton variant="ghost" type="button" className="w-full justify-center">
                REQUEST_CRED
              </GlitchButton>
            </div>

            {/* Footer bar */}
            <div className="pt-2 flex items-center justify-between border-t border-[oklch(0.68_0.32_340_/_0.2)] font-mono-data text-[9px] text-muted-foreground/60">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1 w-1 rounded-full bg-[var(--neon-cyan)] animate-pulse-soft" />
                ENC: AES-512
              </span>
              <span className="text-[var(--neon-yellow)]/60">SEC_LEVEL: 02</span>
            </div>
          </form>
        </Panel>

        <p className="mt-5 text-center font-mono-data text-[9px] text-muted-foreground/40 tracking-[0.2em] animate-fade-in">
          (c) 2077 ARASAKA//SUBSIDIARY · UNAUTHORIZED ACCESS = LETHAL_RESPONSE
        </p>
      </div>
    </div>
  );
}
