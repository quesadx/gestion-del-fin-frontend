import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { ROLE_LANDING } from '@/shared/lib/roleGuards';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { TacticalButton } from '@/components/tactical/TacticalButton';
import { ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(3, 'Minimum 3 characters required'),
  password: z.string().min(8, 'Minimum 8 characters required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const role = useAuthStore((state) => state.role);

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) => login(values),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: resolved(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  const isLoading = mutation.isPending;
  const authError = useMemo(
    () => (mutation.error instanceof Error ? mutation.error.message : ''),
    [mutation.error],
  );

  if (isAuthenticated) {
    const landing = role ? (ROLE_LANDING[role] ?? '/dashboard') : '/dashboard';

    return <Navigate to={landing} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    await mutation.mutateAsync(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent relative">
      <div className="w-full max-w-md animate-fade-in">
        <GlassPanel accent="cyan" variant="heavy" bracketed className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gdf-accent-primary mb-4">
              <ShieldAlert size={24} className="text-gdf-text-inverse" />
            </div>
            <h1 className="font-sans text-2xl font-black tracking-tighter uppercase text-gdf-text-primary">
              End Management
            </h1>
            <p className="font-mono text-[10px] text-gdf-text-muted uppercase tracking-widest mt-2">
              TACTICAL COMMAND // AUTHENTICATION
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block mb-2 font-mono text-[10px] font-bold tracking-widest uppercase text-gdf-text-secondary">
                Operator ID
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="Enter your operator ID"
                className="w-full bg-gdf-surface-base/50 border border-gdf-border-subtle text-gdf-text-primary font-mono text-sm p-3 focus:border-gdf-accent-primary focus:ring-1 focus:ring-gdf-accent-primary/20 outline-none rounded-md placeholder:text-gdf-text-muted"
              />
              {errors.username && (
                <p className="mt-1.5 font-mono text-[10px] text-gdf-status-danger">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-mono text-[10px] font-bold tracking-widest uppercase text-gdf-text-secondary">
                Cipher Key
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your cipher key"
                className="w-full bg-gdf-surface-base/50 border border-gdf-border-subtle text-gdf-text-primary font-mono text-sm p-3 focus:border-gdf-accent-primary focus:ring-1 focus:ring-gdf-accent-primary/20 outline-none rounded-md placeholder:text-gdf-text-muted"
              />
              {errors.password && (
                <p className="mt-1.5 font-mono text-[10px] text-gdf-status-danger">
                  {errors.password.message}
                </p>
              )}
            </div>

            {authError && (
              <div className="border border-gdf-status-danger/30 bg-gdf-status-danger/10 p-3 font-mono text-[11px] text-gdf-status-danger animate-slide-up rounded-md">
                INVALID CREDENTIALS
              </div>
            )}

            <TacticalButton variant="primary" type="submit" disabled={isLoading} className="w-full">
              {isLoading ? 'AUTHENTICATING...' : 'AUTHENTICATE'}
            </TacticalButton>

            <div className="pt-4 border-t border-gdf-glass-border flex items-center justify-between font-mono text-[10px] text-gdf-text-muted uppercase">
              <span>ENC: AES-256</span>
              <span>SEC LEVEL: 02</span>
            </div>
          </form>
        </GlassPanel>

        <p className="mt-6 text-center font-mono text-[9px] text-gdf-text-muted tracking-[0.1em] uppercase">
          Unauthorized access will be prosecuted
        </p>
      </div>
    </div>
  );
}
