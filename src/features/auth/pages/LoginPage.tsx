import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { crtOn, glitch, cursorBlink } from "@/shared/lib/motion";
import { useAuthStore } from "../store/auth.store";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const reduceMotion = useReducedMotion();
  const pageIntro = reduceMotion ? {} : crtOn;

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const fullTitle = "RESTRICTED ACCESS";
  const [displayedTitle, setDisplayedTitle] = useState("");

  const playTickSound = () => {
    try {
      const AudioContext =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // Browser autoplay policy might block this until user interacts, which is fine.
    }
  };

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      setDisplayedTitle(fullTitle.substring(0, currentIdx));
      playTickSound();

      if (currentIdx >= fullTitle.length) {
        clearInterval(interval);
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const handleBypass = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();

    login("fake-jwt-token-777", {
      id: "u-001",
      username: username || "ADMIN_DEV",
      role: "system_admin",
      campId: "camp-alpha",
    });

    navigate("/dashboard");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    handleBypass();
  };

  return (
    <motion.div
      className="relative flex flex-1 min-h-0 w-full flex-col overflow-hidden font-mono text-green-base"
      variants={pageIntro}
      initial="initial"
      animate="animate"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 flex flex-col items-center custom-scrollbar">
        <div className="my-auto flex w-full flex-col items-center py-6">
          <div className="mb-8 flex w-full max-w-2xl flex-col items-center justify-center sm:mb-12">
            <div
              className="h-3 sm:h-4 w-full opacity-90 relative"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, var(--clr-danger), var(--clr-danger) 10px, transparent 10px, transparent 20px)",
              }}
            />

            <motion.div
              className="my-8 text-center px-2"
              variants={reduceMotion ? {} : glitch}
              animate="animate"
            >
              <h1 className="mb-3 font-display text-[1.4rem] leading-snug tracking-widest text-[#f4d4a8] sm:text-4xl md:text-5xl md:tracking-[0.2em] break-words">
                {displayedTitle}
                <motion.span
                  variants={cursorBlink}
                  animate="animate"
                  className="inline-block h-[1em] w-3 lg:w-4 bg-[#f4d4a8] ml-2"
                />
              </h1>
              <p className="font-display text-[9px] tracking-widest text-green-mid sm:text-xs sm:tracking-[0.2em] md:text-sm">
                PROPRIETARY OF ELORG CORP // DIVISION 7
              </p>
            </motion.div>

            <div
              className="h-3 sm:h-4 w-full opacity-90"
              style={{
                background:
                  "repeating-linear-gradient(-45deg, var(--clr-danger), var(--clr-danger) 10px, transparent 10px, transparent 20px)",
              }}
            />
          </div>
          <div className="relative w-full max-w-lg bg-bg-panel p-6 sm:p-8 shadow-glow-subtle mb-4">
            <div className="absolute -left-[2px] -top-[2px] h-4 sm:h-6 w-4 sm:w-6 border-l-[2px] border-t-[2px] border-green-bright" />
            <div className="absolute -right-[2px] -top-[2px] h-4 sm:h-6 w-4 sm:w-6 border-r-[2px] border-t-[2px] border-green-bright" />
            <div className="absolute -bottom-[2px] -left-[2px] h-4 sm:h-6 w-4 sm:w-6 border-b-[2px] border-l-[2px] border-green-bright" />
            <div className="absolute -bottom-[2px] -right-[2px] h-4 sm:h-6 w-4 sm:w-6 border-b-[2px] border-r-[2px] border-green-bright" />

            <form
              onSubmit={handleLogin}
              className="flex flex-col gap-6 lg:gap-8"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="w-24 font-display text-sm tracking-wide text-green-bright">
                  LOGIN:
                </label>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full border-b border-green-mid bg-[#1a2e1d] p-3 pl-4 font-mono text-xl uppercase tracking-widest text-green-hi shadow-inner transition-colors focus:border-green-bright focus:outline-none focus:ring-1 focus:ring-green-dim"
                  />
                  {!username && (
                    <motion.span
                      className="pointer-events-none absolute left-4 top-[14px] h-[18px] w-3 bg-green-glow"
                      variants={cursorBlink}
                      animate="animate"
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="w-24 font-display text-sm tracking-wide text-green-base">
                  KEY:
                </label>
                <div className="relative flex-1">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-b border-green-mid bg-[#1a2e1d] p-3 pl-4 font-mono text-xl tracking-[0.3em] text-green-hi shadow-inner transition-colors focus:border-green-bright focus:outline-none focus:ring-1 focus:ring-green-dim"
                  />
                  {username && !password && (
                    <motion.span
                      className="pointer-events-none absolute left-4 top-[14px] h-[18px] w-3 bg-green-glow opacity-80"
                      variants={cursorBlink}
                      animate="animate"
                    />
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:gap-6">
                <button
                  type="submit"
                  className="group relative flex-1 bg-green-bright py-4 font-display text-sm text-black shadow-glow-strong transition-all focus:outline-none uppercase tracking-wide overflow-hidden"
                >
                  <div className="absolute top-0 right-full h-full w-[20px] bg-white opacity-20 transform skew-x-[-20deg] group-hover:animate-[scanBtn_0.5s_ease-in-out_infinite]" />
                  <span className="relative z-10 group-hover:font-extrabold transition-all group-hover:tracking-[0.15em]">
                    [ EXECUTE ]
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleBypass}
                  className="group flex-1 border-2 border-green-bright bg-transparent py-4 font-display text-sm text-green-bright transition-colors hover:bg-green-mid hover:text-black focus:outline-none uppercase tracking-wide relative overflow-hidden"
                >
                  <span className="relative z-10 transition-all group-hover:tracking-[0.15em]">
                    [ BYPASS ]
                  </span>
                </button>
              </div>
            </form>
          </div>{" "}
        </div>{" "}
      </div>

      <div className="mt-auto shrink-0 flex justify-between border-t border-dashed border-green-dim pt-2 pb-1 px-4 font-system text-[10px] uppercase tracking-widest text-green-dim md:text-xs z-10 w-full bg-bg-screen/90 backdrop-blur-sm">
        <ul className="flex flex-col justify-end gap-1">
          <li className="hidden sm:block">KERNEL: 4.1.0-REDACTED</li>
          <li>UPTIME: 334:12:09</li>
        </ul>
        <ul className="flex flex-col items-center justify-end gap-1">
          <li className="hidden sm:block">ENCRYPTION: 1024-BIT ASYMMETRIC</li>
          <li>LOC: 55.7558 N, 37.6173 E</li>
        </ul>
        <ul className="flex flex-col items-end justify-end gap-1">
          <li className="hidden sm:block">HARDWARE: WRIST-UNIT M-V</li>
          <li>SERIAL: #E-99-001</li>
        </ul>
      </div>
    </motion.div>
  );
}
