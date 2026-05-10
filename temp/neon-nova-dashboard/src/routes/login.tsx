import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { WaveBackground } from "@/components/cyber/WaveBackground";
import { Panel } from "@/components/cyber/Panel";
import { GlitchButton } from "@/components/cyber/GlitchButton";
import { Lock, User, Zap } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "JACK_IN // NIGHT//CITY_OS" },
      {
        name: "description",
        content: "Secure netrunner authentication portal for NIGHT//CITY_OS.",
      },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/" }), 900);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 py-10 text-foreground">
      <WaveBackground />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div
            className="w-9 h-9 clip-corners-sm bg-[var(--neon-fuchsia)] flex items-center justify-center"
            style={{ boxShadow: "var(--glow-fuchsia)" }}
          >
            <Zap className="w-4 h-4 text-[var(--charcoal)]" strokeWidth={3} />
          </div>
          <div>
            <h1 className="font-display text-base font-black tracking-[0.3em] text-glow-fuchsia leading-none">
              NIGHT//CITY_OS
            </h1>
            <span className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest">
              v2.077.kitsch · SECURE_GATEWAY
            </span>
          </div>
        </div>

        <Panel title="JACK_IN" tag="AUTH.01" status="AWAITING" accent="fuchsia">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest block mb-1.5">
                OPERATOR_ID //
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neon-cyan)]" />
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="V.SILVERHAND"
                  className="w-full clip-corners-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] focus:border-[var(--neon-fuchsia)] focus:shadow-[var(--glow-fuchsia)] outline-none pl-9 pr-3 py-2.5 font-mono-data text-sm text-[var(--neon-fuchsia)] placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest block mb-1.5">
                CIPHER_KEY //
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neon-cyan)]" />
                <input
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••"
                  className="w-full clip-corners-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] focus:border-[var(--neon-cyan)] focus:shadow-[var(--glow-cyan)] outline-none pl-9 pr-3 py-2.5 font-mono-data text-sm text-[var(--neon-cyan)] placeholder:text-muted-foreground/50 transition-all"
                />
              </div>
            </div>

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
                disabled={loading}
                className="w-full justify-center"
              >
                {loading ? "▌ AUTHENTICATING..." : "⚡ JACK_IN"}
              </GlitchButton>
              <GlitchButton variant="ghost" type="button" className="w-full justify-center">
                REQUEST_CRED
              </GlitchButton>
            </div>

            <div className="pt-3 mt-2 border-t border-[oklch(0.68_0.32_340_/_0.2)] flex items-center justify-between font-mono-data text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)] flicker"
                  style={{ boxShadow: "0 0 8px var(--neon-cyan)" }}
                />
                ENC: AES-512
              </span>
              <span className="text-[var(--neon-yellow)] text-glow-yellow">SEC_LEVEL: 02</span>
            </div>
          </form>
        </Panel>

        <p className="mt-4 text-center font-mono-data text-[10px] text-muted-foreground tracking-widest">
          © 2077 ARASAKA//SUBSIDIARY · UNAUTHORIZED ACCESS = LETHAL_RESPONSE
        </p>
      </div>
    </div>
  );
}
