import { useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WaveBackground } from '@/components/cyber/WaveBackground';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { Lock, User, Zap } from 'lucide-react';
import { useAuth } from '@/features/auth/auth-context';

const loginSchema = z.object({
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres.'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();

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

  const onSubmit = async (values: LoginFormValues) => {
    await mutation.mutateAsync(values);
  };

  const isLoading = mutation.status === 'pending';
  const status = isLoading ? 'AUTHENTICATING' : 'AWAITING';
  const submitLabel = isLoading ? 'AUTHENTICATING...' : 'JACK_IN';
  const loginSuccess = mutation.isSuccess;
  const authError = useMemo(
    () => (mutation.error instanceof Error ? mutation.error.message : ''),
    [mutation.error],
  );

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-10 text-foreground">
      <WaveBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div
            className="w-9 h-9 clip-corners-sm bg-[var(--neon-fuchsia)] flex items-center justify-center"
            style={{ boxShadow: 'var(--glow-fuchsia)' }}
          >
            <Zap className="w-4 h-4 text-[var(--charcoal)]" strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-display text-base font-black tracking-[0.3em] text-glow-fuchsia leading-none">
              GESTION DEL FIN
            </h1>
            <span className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest">
              v1.0.0 - GESTION DEL FIN
            </span>
          </div>
        </div>

        <Panel title="JACK_IN" tag="AUTH.01" status={status} accent="fuchsia">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest block mb-1.5">
                OPERATOR_ID //
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neon-cyan)]" />
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  placeholder="V.SILVERHAND"
                  className="w-full clip-corners-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] focus:border-[var(--neon-fuchsia)] focus:shadow-[var(--glow-fuchsia)] outline-none pl-9 pr-3 py-2.5 font-mono-data text-sm text-[var(--neon-fuchsia)] placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
              {errors.username && (
                <p className="mt-2 text-[10px] text-[var(--neon-yellow)]">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest block mb-1.5">
                CIPHER_KEY //
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neon-cyan)]" />
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="**********"
                  className="w-full clip-corners-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] focus:border-[var(--neon-cyan)] focus:shadow-[var(--glow-cyan)] outline-none pl-9 pr-3 py-2.5 font-mono-data text-sm text-[var(--neon-cyan)] placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-[10px] text-[var(--neon-yellow)]">{errors.password.message}</p>
              )}
            </div>

            {authError ? (
              <div className="rounded-xl bg-[oklch(0.08_0.05_320_/_0.7)] border border-[var(--neon-yellow)] p-3 text-[10px] text-[var(--neon-yellow)]">
                {authError}
              </div>
            ) : null}

            {loginSuccess ? (
              <div className="rounded-xl bg-[oklch(0.08_0.05_160_/_0.7)] border border-[var(--neon-cyan)] p-3 text-[10px] text-[var(--neon-cyan)]">
                ACCESS GRANTED. SESSION INITIALIZED.
              </div>
            ) : null}

            <div className="flex items-center justify-between font-mono-data text-[10px]">
              <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                <input type="checkbox" className="accent-[var(--neon-fuchsia)]" />
                PERSIST_SESSION
              </label>
              <a
                href="#"
                className="text-[var(--neon-cyan)] hover:text-glow-fuchsia tracking-widest"
              >
                RESET_KEY?
              </a>
            </div>

            <div className="pt-2 flex flex-col gap-3">
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

            <div className="pt-3 mt-2 border-t border-[oklch(0.68_0.32_340_/_0.2)] flex items-center justify-between font-mono-data text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)] flicker"
                  style={{ boxShadow: '0 0 8px var(--neon-cyan)' }}
                />
                ENC: AES-512
              </span>
              <span className="text-[var(--neon-yellow)] text-glow-yellow">SEC_LEVEL: 02</span>
            </div>
          </form>
        </Panel>

        <p className="mt-4 text-center font-mono-data text-[10px] text-muted-foreground tracking-widest">
          (c) 2077 ARASAKA//SUBSIDIARY - UNAUTHORIZED ACCESS = LETHAL_RESPONSE
        </p>
      </div>
    </div>
  );
}
