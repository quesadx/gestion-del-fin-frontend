import { createFileRoute } from "@tanstack/react-router";
import { WaveBackground } from "@/components/cyber/WaveBackground";
import { Panel } from "@/components/cyber/Panel";
import { RingMeter } from "@/components/cyber/RingMeter";
import { GlitchButton } from "@/components/cyber/GlitchButton";
import { DataChart } from "@/components/cyber/DataChart";
import { Activity, Cpu, Radio, Shield, Terminal, Wifi, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "NIGHT//CITY OS — Kitsch Dashboard" },
      {
        name: "description",
        content:
          "Cyberpunk 2077 Kitsch-inspired HUD dashboard with neon glassmorphism, glitch effects and live telemetry.",
      },
    ],
  }),
});

function TechLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono-data text-[10px] text-[var(--neon-cyan)]/70 tracking-widest">
      {children}
    </span>
  );
}

function Index() {
  return (
    <div className="relative min-h-screen text-foreground">
      <WaveBackground />

      {/* Top status bar */}
      <header className="relative z-10 border-b border-[oklch(0.68_0.32_340_/_0.3)] backdrop-blur-md bg-[oklch(0.1_0.03_320_/_0.6)]">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 clip-corners-sm bg-[var(--neon-fuchsia)] flex items-center justify-center"
              style={{ boxShadow: "var(--glow-fuchsia)" }}
            >
              <Zap className="w-4 h-4 text-[var(--charcoal)]" strokeWidth={3} />
            </div>
            <div>
              <h1 className="font-display text-base font-black tracking-[0.3em] text-glow-fuchsia leading-none">
                NIGHT//CITY_OS
              </h1>
              <TechLabel>v2.077.kitsch · NETRUNNER MAINFRAME</TechLabel>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 font-tech text-xs">
            {["DASHBOARD", "NETRUN", "ARSENAL", "INTEL", "COMMS"].map((n, i) => (
              <a
                key={n}
                href="#"
                className={`relative hover:text-[var(--neon-cyan)] transition-colors ${i === 0 ? "text-[var(--neon-fuchsia)] text-glow-fuchsia" : "text-muted-foreground"}`}
              >
                {n}
                {i === 0 && (
                  <span
                    className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--neon-fuchsia)]"
                    style={{ boxShadow: "0 0 6px var(--neon-fuchsia)" }}
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 font-mono-data text-[10px] text-muted-foreground">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[var(--neon-cyan)] flicker"
                style={{ boxShadow: "0 0 8px var(--neon-cyan)" }}
              />
              SYSTEM_ACTIVE
            </div>
            <div className="font-mono-data text-[10px] text-[var(--neon-yellow)] text-glow-yellow">
              SEC_LEVEL: 02
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1400px] mx-auto px-6 py-8">
        {/* Hero / status row */}
        <section className="grid grid-cols-12 gap-5 mb-5">
          <Panel tag="ID_0xFA77" status="ONLINE" className="col-span-12 lg:col-span-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <TechLabel>OPERATOR PROFILE //</TechLabel>
                <h2 className="font-display text-4xl md:text-5xl font-black mt-2 leading-none text-glow-fuchsia">
                  V. SILVERHAND
                </h2>
                <p className="font-tech text-sm text-muted-foreground mt-2">
                  CLASS_NETRUNNER · STREET_CRED 87 · BIOCHIP MK.IV
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <GlitchButton variant="warning">⚡ JACK_IN</GlitchButton>
                  <GlitchButton variant="ghost">SCAN_GRID</GlitchButton>
                  <GlitchButton variant="ghost">UPLINK</GlitchButton>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="font-mono-data text-[10px] text-muted-foreground">
                    EUROCREDITS
                  </div>
                  <div className="font-display text-3xl text-[var(--neon-yellow)] text-glow-yellow">
                    € 142,880
                  </div>
                </div>
                <div className="w-px h-12 bg-[var(--neon-fuchsia)]/40" />
                <div className="text-right">
                  <div className="font-mono-data text-[10px] text-muted-foreground">HEAT</div>
                  <div className="font-display text-3xl text-[var(--neon-fuchsia)] text-glow-fuchsia">
                    07
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          <Panel tag="VITALS" accent="cyan" status="STABLE" className="col-span-12 lg:col-span-4">
            <div className="grid grid-cols-3 gap-2">
              <RingMeter value={84} label="HEALTH" sublabel="HP/MAX" color="fuchsia" size={100} />
              <RingMeter value={62} label="STAMINA" sublabel="STM" color="cyan" size={100} />
              <RingMeter value={91} label="RAM" sublabel="GB/12" color="yellow" size={100} />
            </div>
          </Panel>
        </section>

        {/* Main grid */}
        <section className="grid grid-cols-12 gap-5">
          {/* Network telemetry */}
          <Panel
            title="NETWORK_FLUX"
            tag="GRF.01"
            status="LIVE_FEED"
            className="col-span-12 lg:col-span-8"
          >
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <div className="font-display text-4xl text-glow-fuchsia">
                  2.84 <span className="text-base text-muted-foreground font-mono-data">TB/s</span>
                </div>
                <TechLabel>↑ 12.4% LAST_CYCLE</TechLabel>
              </div>
              <div className="flex gap-3 font-mono-data text-[10px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[var(--neon-fuchsia)]" />
                  INGRESS
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[var(--neon-cyan)]" />
                  EGRESS
                </span>
              </div>
            </div>
            <DataChart />
            <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-[oklch(0.68_0.32_340_/_0.2)]">
              {[
                { l: "PING", v: "12ms", c: "cyan" },
                { l: "PACKETS", v: "8.2M", c: "fuchsia" },
                { l: "NODES", v: "147", c: "cyan" },
                { l: "INTRUSIONS", v: "03", c: "yellow" },
              ].map((s) => (
                <div key={s.l}>
                  <TechLabel>{s.l}</TechLabel>
                  <div
                    className={`font-mono-data text-lg mt-1 ${s.c === "fuchsia" ? "text-[var(--neon-fuchsia)]" : s.c === "cyan" ? "text-[var(--neon-cyan)]" : "text-[var(--neon-yellow)]"}`}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* System status */}
          <Panel
            title="SYS_DAEMON"
            tag="LOG"
            accent="cyan"
            status="STREAMING"
            className="col-span-12 lg:col-span-4"
          >
            <ul className="space-y-2 font-mono-data text-[11px]">
              {[
                { t: "02:47:11", m: "ICE breaker deployed → node_47", c: "fuchsia" },
                { t: "02:46:58", m: "SUCCESS: payload injected", c: "cyan" },
                { t: "02:46:30", m: "WARN: trace detected, masking…", c: "yellow" },
                { t: "02:45:12", m: "Daemon NETWATCH idle", c: "muted" },
                { t: "02:44:09", m: "Cyberdeck overclock +18%", c: "cyan" },
                { t: "02:43:55", m: "Quickhack queue · 4 pending", c: "fuchsia" },
                { t: "02:42:21", m: "Connection: PACIFICA_GRID", c: "cyan" },
                { t: "02:40:00", m: "BOOT_SEQ complete", c: "muted" },
              ].map((l, i) => (
                <li
                  key={i}
                  className="flex gap-3 hover:bg-[oklch(0.85_0.22_200_/_0.05)] px-1 py-0.5 transition-colors"
                >
                  <span className="text-muted-foreground/60">{l.t}</span>
                  <span
                    className={
                      l.c === "fuchsia"
                        ? "text-[var(--neon-fuchsia)]"
                        : l.c === "cyan"
                          ? "text-[var(--neon-cyan)]"
                          : l.c === "yellow"
                            ? "text-[var(--neon-yellow)]"
                            : "text-muted-foreground"
                    }
                  >
                    » {l.m}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>

          {/* Quickhack arsenal */}
          <Panel
            title="QUICKHACKS"
            tag="ARS.02"
            status="04 READY"
            className="col-span-12 lg:col-span-5"
          >
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  n: "OVERHEAT",
                  i: Zap,
                  lvl: "MK.III",
                  cost: 8,
                  color: "oklch(0.68 0.32 340)",
                  border: "oklch(0.68 0.32 340 / 0.5)",
                },
                {
                  n: "PING",
                  i: Radio,
                  lvl: "MK.II",
                  cost: 2,
                  color: "oklch(0.85 0.22 200)",
                  border: "oklch(0.85 0.22 200 / 0.5)",
                },
                {
                  n: "SYS_RESET",
                  i: Cpu,
                  lvl: "MK.IV",
                  cost: 18,
                  color: "oklch(0.92 0.2 100)",
                  border: "oklch(0.92 0.2 100 / 0.5)",
                },
                {
                  n: "CONTAGION",
                  i: Activity,
                  lvl: "MK.II",
                  cost: 6,
                  color: "oklch(0.68 0.32 340)",
                  border: "oklch(0.68 0.32 340 / 0.5)",
                },
              ].map((q) => {
                const Icon = q.i;
                const color = q.color;
                return (
                  <div
                    key={q.n}
                    className="relative clip-corners-sm p-3 border bg-[oklch(0.15_0.05_320_/_0.4)] hover:bg-[oklch(0.2_0.08_325_/_0.5)] transition-all cursor-pointer"
                    style={{ borderColor: q.border }}
                  >
                    <div className="flex items-start justify-between">
                      <Icon
                        className="w-5 h-5"
                        style={{ color, filter: `drop-shadow(0 0 6px ${color})` }}
                      />
                      <span className="font-mono-data text-[9px] text-muted-foreground">
                        {q.lvl}
                      </span>
                    </div>
                    <div className="mt-3 font-display text-sm font-bold" style={{ color }}>
                      {q.n}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="font-mono-data text-[10px] text-muted-foreground">
                        RAM_COST
                      </span>
                      <span className="font-mono-data text-xs" style={{ color }}>
                        {q.cost}
                      </span>
                    </div>
                    <div
                      className="absolute top-0 right-0 w-2 h-2"
                      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                    />
                  </div>
                );
              })}
            </div>
          </Panel>

          {/* Threat radar */}
          <Panel
            title="THREAT_RADAR"
            tag="SEC.03"
            accent="cyan"
            status="SCANNING"
            className="col-span-12 lg:col-span-4"
          >
            <div className="relative aspect-square max-w-[260px] mx-auto">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {[40, 70, 100].map((r) => (
                  <circle
                    key={r}
                    cx="100"
                    cy="100"
                    r={r / 2 + 30}
                    fill="none"
                    stroke="oklch(0.85 0.22 200 / 0.2)"
                  />
                ))}
                <line x1="100" y1="20" x2="100" y2="180" stroke="oklch(0.85 0.22 200 / 0.2)" />
                <line x1="20" y1="100" x2="180" y2="100" stroke="oklch(0.85 0.22 200 / 0.2)" />
                <defs>
                  <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--neon-cyan)" stopOpacity="0" />
                    <stop offset="100%" stopColor="var(--neon-cyan)" stopOpacity="0.6" />
                  </linearGradient>
                </defs>
                <g style={{ transformOrigin: "100px 100px", animation: "spin 4s linear infinite" }}>
                  <path d="M 100 100 L 100 20 A 80 80 0 0 1 180 100 Z" fill="url(#sweep)" />
                </g>
                {[
                  { x: 70, y: 60, c: "fuchsia" },
                  { x: 140, y: 90, c: "yellow" },
                  { x: 60, y: 140, c: "cyan" },
                  { x: 130, y: 150, c: "fuchsia" },
                ].map((d, i) => (
                  <circle
                    key={i}
                    cx={d.x}
                    cy={d.y}
                    r="3"
                    fill={
                      d.c === "fuchsia"
                        ? "var(--neon-fuchsia)"
                        : d.c === "cyan"
                          ? "var(--neon-cyan)"
                          : "var(--neon-yellow)"
                    }
                    style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
                  >
                    <animate
                      attributeName="opacity"
                      values="1;0.3;1"
                      dur="2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                ))}
              </svg>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="font-display text-lg text-[var(--neon-fuchsia)]">02</div>
                <TechLabel>HOSTILE</TechLabel>
              </div>
              <div>
                <div className="font-display text-lg text-[var(--neon-yellow)]">01</div>
                <TechLabel>ALERT</TechLabel>
              </div>
              <div>
                <div className="font-display text-lg text-[var(--neon-cyan)]">07</div>
                <TechLabel>NEUTRAL</TechLabel>
              </div>
            </div>
          </Panel>

          {/* Implants */}
          <Panel
            title="CYBERWARE"
            tag="IMP.04"
            status="04 INSTALLED"
            className="col-span-12 lg:col-span-3"
          >
            <ul className="space-y-3">
              {[
                { n: "Kiroshi Optics", v: "MK.III", p: 92, i: Shield },
                { n: "Sandevistan", v: "MK.IV", p: 76, i: Zap },
                { n: "Berserk Mod", v: "MK.II", p: 48, i: Activity },
                { n: "NetWatch ICE", v: "MK.I", p: 33, i: Wifi },
              ].map((c) => {
                const Icon = c.i;
                return (
                  <li key={c.n}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-[var(--neon-cyan)]" />
                        <span className="font-tech text-xs">{c.n}</span>
                      </div>
                      <span className="font-mono-data text-[10px] text-muted-foreground">
                        {c.v}
                      </span>
                    </div>
                    <div className="relative h-1.5 bg-[oklch(0.2_0.05_320_/_0.6)] clip-corners-sm overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-[var(--neon-fuchsia)] to-[var(--neon-cyan)]"
                        style={{ width: `${c.p}%`, boxShadow: "0 0 8px var(--neon-fuchsia)" }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Panel>
        </section>

        {/* Footer ticker */}
        <footer className="mt-8 border-t border-[oklch(0.68_0.32_340_/_0.3)] pt-4 flex flex-wrap items-center justify-between gap-3 font-mono-data text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3" />
            <span>END_OF_LINE · UPTIME 02:47:11 · NODE PACIFICA_47</span>
          </div>
          <div className="flex items-center gap-3">
            <span>© 2077 ARASAKA//SUBSIDIARY</span>
            <span className="text-[var(--neon-fuchsia)]">SEC_LEVEL: 02</span>
            <span className="text-[var(--neon-cyan)]">ENC: AES-512</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
