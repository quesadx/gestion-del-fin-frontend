import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, ShieldAlert } from 'lucide-react';

interface AccessDeniedProps {
  role?: string;
}

export function AccessDenied({ role }: AccessDeniedProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-15rem)] flex items-center justify-center px-3 py-10">
      <div className="w-full max-w-xl bg-surface-raised brutalist-border rounded-xl p-6 sm:p-8 space-y-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-xl bg-red-950/40 border border-red-500/25 flex items-center justify-center text-brand-primary shadow-[0_0_24px_rgba(239,68,68,0.14)]">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest">
            Access control
          </p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white">
            Permission required
          </h1>
          <p className="text-sm font-mono text-zinc-500">
            Your current role is not authorized to access this section.
          </p>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-900 rounded p-4 text-left space-y-2">
          {role && (
            <p className="text-xs font-mono text-zinc-500">
              Role <span className="text-zinc-200 font-bold">{role}</span>
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Go Back
          </button>
          <Link
            to="/dashboard"
            className="flex-1 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors inline-flex items-center justify-center gap-2"
          >
            <LayoutDashboard size={14} />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
