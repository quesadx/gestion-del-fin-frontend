import { Outlet, Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { crtOn } from "@/shared/lib/motion";
import {
  Activity,
  Users,
  Package,
  Map,
  ArrowRightLeft,
  LogOut,
} from "lucide-react";

// cspell:disable
export function PrivateLayout() {
  const location = useLocation();

  const NAV_ITEMS = [
    { path: "/dashboard", label: "STAT", icon: Activity },
    { path: "/people", label: "PERS", icon: Users },
    { path: "/inventory", label: "INV", icon: Package },
    { path: "/explorations", label: "MAP", icon: Map },
    { path: "/transfers", label: "LOG", icon: ArrowRightLeft },
  ];

  return (
    <motion.div
      className="relative flex h-full w-full font-mono text-green-base overflow-hidden"
      variants={crtOn}
      initial="initial"
      animate="animate"
    >
      <aside className="flex w-24 sm:w-32 flex-col border-r-2 border-green-mid bg-bg-panel p-4">
        <div className="mb-8 flex flex-col items-center text-center opacity-80 shrink-0">
          <div className="mb-2 grid grid-cols-2 gap-1">
            <div className="h-3 w-3 bg-green-bright"></div>
            <div className="h-3 w-3 bg-green-hi"></div>
            <div className="h-3 w-3 border border-green-mid"></div>
            <div className="h-3 w-3 bg-green-base"></div>
          </div>
          <span className="font-display text-[8px] sm:text-[10px] uppercase tracking-widest text-green-dim">
            SECTOR-7G
            <br />
            TAC_CMD
          </span>
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto custom-scrollbar min-h-0 py-2 pr-1">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex flex-col items-center justify-center border-2 border-dashed p-3 transition-colors ${
                  isActive
                    ? "border-green-bright bg-green-bright/10 text-green-hi shadow-glow-subtle"
                    : "border-green-mid/50 text-green-mid hover:border-green-base hover:text-green-bright"
                }`}
              >
                <Icon size={24} className="mb-2" />
                <span className="font-display text-[10px] uppercase tracking-wider">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <button className="mt-auto flex flex-col items-center text-danger hover:text-danger-text hover:shadow-glow-text transition-colors shrink-0 pt-4">
          <LogOut size={20} className="mb-2" />
          <span className="font-display text-[9px] tracking-widest">
            REBOOT
          </span>
        </button>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden bg-bg-screen">
        <header className="flex shrink-0 items-center justify-between border-b-2 border-green-mid p-4 bg-bg-panel">
          <h1 className="font-display text-lg tracking-widest text-[#f4d4a8]">
            ELORG TERMINAL V.4.02
          </h1>
          <div className="flex items-center gap-4">
            <span className="border border-green-base px-2 py-1 font-system text-xs uppercase text-green-base">
              AUTH_MODE: ADMIN
            </span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </motion.div>
  );
}
