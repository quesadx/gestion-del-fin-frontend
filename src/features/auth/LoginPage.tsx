import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store';
import { apiClient } from '../../lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ShieldAlert, Loader2, KeyRound, User } from 'lucide-react';
import StarBorder from '../../components/ui/StarBorder';
import { motion, AnimatePresence } from 'motion/react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(() => {
    const expired = localStorage.getItem('session_expired');
    if (expired) {
      localStorage.removeItem('session_expired');
      return true;
    }
    return false;
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      const res = await apiClient.post('/auth/login', data);
      setAuth(res.data.user, res.data.token);
      navigate('/dashboard');
    } catch (err) {
      const authError = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      const message = err instanceof Error ? err.message : authError.response?.data?.error?.message;
      setError(message || 'Authentication failed. Check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl mb-4 text-brand-primary">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-3xl font-black tracking-tighter text-brand-primary">GESTION DEL FIN</h1>
        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
          GESTION DEL FIN v1.0.0 // AUTH REQUIRED
        </p>
      </div>

      <AnimatePresence mode="wait">
        {sessionExpired && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-amber-950/20 border border-amber-500/50 rounded-lg flex items-start gap-3"
          >
            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
            <div className="text-sm font-medium text-amber-500">
              <p className="font-bold uppercase leading-none mb-1">Session Closed</p>
              <p className="text-xs text-amber-500/70">
                Terminal locked down automatically after 20 minutes of system inactivity to prevent
                unauthorized breach.
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-950/20 border border-red-500/50 rounded-lg flex items-start gap-3"
          >
            <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="relative group">
            <User
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors"
              size={18}
            />
            <input
              {...register('username')}
              placeholder="IDENTIFIER"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all font-mono placeholder:text-zinc-600"
            />
            {errors.username && (
              <p className="text-[10px] text-red-500 mt-1 pl-1 font-bold">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="relative group">
            <KeyRound
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-brand-primary transition-colors"
              size={18}
            />
            <input
              {...register('password')}
              type="password"
              placeholder="PASSCODE"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/50 transition-all font-mono placeholder:text-zinc-600"
            />
            {errors.password && (
              <p className="text-[10px] text-red-500 mt-1 pl-1 font-bold">
                {errors.password.message}
              </p>
            )}
          </div>
        </div>

        <StarBorder
          as="button"
          disabled={isLoading}
          type="submit"
          className="w-full group relative hover:scale-[1.02] hover:brightness-110 transition-all duration-200"
          color="rgba(239,68,68,0.95)"
          speed="5s"
          thickness={2}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <span className="relative z-10 font-black">REQUEST AUTHORIZATION</span>
          )}
        </StarBorder>
      </form>

      <div className="pt-6 border-t border-zinc-900 space-y-4">
        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest text-center">
          AUTHORIZED SECTOR TERMINAL SIGNATURES:
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 border border-zinc-800 bg-zinc-950/60 rounded text-center">
            <span className="text-brand-primary font-bold font-mono text-xs">admin</span>
            <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
              Control
            </p>
          </div>
          <div className="p-2 border border-zinc-800 bg-zinc-950/60 rounded text-center">
            <span className="text-brand-secondary font-bold font-mono text-xs">manager</span>
            <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
              Resources
            </p>
          </div>
          <div className="p-2 border border-zinc-800 bg-zinc-950/60 rounded text-center">
            <span className="text-blue-400 font-bold font-mono text-xs">travel</span>
            <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
              Logistics
            </p>
          </div>
        </div>
        <p className="text-[9px] font-mono text-zinc-600 text-center uppercase tracking-wider">
          Access limit enforced based on security keys.
        </p>
      </div>
    </div>
  );
}
