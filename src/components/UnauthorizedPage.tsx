import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShieldBan, ArrowLeft } from 'lucide-react';
import BorderGlow from './BorderGlow';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="w-full max-w-md"
      >
        <BorderGlow
          backgroundColor="#1b0b0c"
          borderRadius={16}
          glowColor="356 78 62"
          glowIntensity={0.9}
          glowRadius={28}
          edgeSensitivity={22}
          coneSpread={18}
          animated={false}
        >
          <div className="relative bg-transparent p-6 sm:p-8 text-center space-y-6">
            <div className="space-y-3">
              <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.12)]">
                <ShieldBan size={30} className="text-red-500" />
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-mono uppercase tracking-widest text-brand-primary">
                  Access Control
                </p>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                  Access Denied
                </h2>
              </div>

              <p className="text-xs font-mono leading-relaxed text-zinc-400 max-w-sm mx-auto">
                Your current role does not have the required permissions to access this section.
                Contact your system administrator if you believe this is an error.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-black font-bold uppercase tracking-wider px-5 py-2.5 rounded-lg text-xs transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </button>
          </div>
        </BorderGlow>
      </motion.div>
    </div>
  );
}
