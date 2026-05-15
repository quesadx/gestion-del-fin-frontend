import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/useAuth';
import { ShieldAlert } from 'lucide-react';

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
    <div className="min-h-screen flex items-center justify-center bg-surface-base">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-surface-raised border border-zinc-800 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-brand-primary mb-4">
              <ShieldAlert size={24} className="text-surface-base" />
            </div>
            <h1 className="font-sans text-2xl font-black tracking-tighter uppercase text-white">
              End Management
            </h1>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
              Authentication Required
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block mb-2 font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                Operator ID
              </label>
              <input
                {...register('username')}
                type="text"
                autoComplete="username"
                placeholder="Enter your operator ID"
                className="w-full bg-surface-base border border-zinc-700 text-zinc-200 font-mono text-sm py-2.5 px-3 placeholder:text-zinc-600 outline-none focus:border-brand-primary transition-colors"
              />
              {errors.username && (
                <p className="mt-1.5 font-mono text-[10px] text-brand-primary">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2 font-mono text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                Cipher Key
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                placeholder="Enter your cipher key"
                className="w-full bg-surface-base border border-zinc-700 text-zinc-200 font-mono text-sm py-2.5 px-3 placeholder:text-zinc-600 outline-none focus:border-brand-primary transition-colors"
              />
              {errors.password && (
                <p className="mt-1.5 font-mono text-[10px] text-brand-primary">
                  {errors.password.message}
                </p>
              )}
            </div>

            {authError && (
              <div className="border border-red-500/30 bg-red-950/30 p-3 font-mono text-[11px] text-red-400 animate-slide-up">
                AUTH FAILURE: {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full font-sans text-sm font-black uppercase tracking-widest px-5 py-3 bg-brand-primary text-surface-base hover:bg-brand-primary/90 active:bg-brand-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE'}
            </button>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-between font-mono text-[10px] text-zinc-600 uppercase">
              <span>ENC: AES-256</span>
              <span>SEC LEVEL: 02</span>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center font-mono text-[9px] text-zinc-700 tracking-[0.1em] uppercase">
          Unauthorized access will be prosecuted
        </p>
      </div>
    </div>
  );
}
