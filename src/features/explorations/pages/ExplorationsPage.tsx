import { motion } from "framer-motion";
import {
  RadioReceiver,
  Activity,
  Skull,
  Clock,
  Map,
  Target,
} from "lucide-react";
import { staggerContainer, staggerItem } from "@/shared/lib/motion";

const DUMMY_EXPLORATIONS = [
  {
    id: "EXP-77",
    destination: "RUINED HOSPITAL",
    leadSurvivor: "MARCUS REED",
    time: "3 DAYS AGO",
    status: "COMPLETED",
    action: "DEBRIEF_LOG",
  },
  {
    id: "EXP-82",
    destination: "SECTOR B // POWER PLANT",
    leadSurvivor: "ELIAS VANCE",
    time: "EST: 5 DAYS",
    status: "IN_PROGRESS",
    action: "MONITOR_FEED",
  },
  {
    id: "EXP-85",
    destination: "SUBWAY TUNNEL ALPHA",
    leadSurvivor: "SARAH CONNOR",
    time: "LOST: 2 DAYS AGO",
    status: "FAILED",
    action: "INITIATE_RECOVERY",
  },
  {
    id: "EXP-88",
    destination: "OLD WORLD ARCHIVE",
    leadSurvivor: "DR. ARIS",
    time: "DURATION: 4 DAYS",
    status: "PENDING",
    action: "DEPLOY_UNIT",
  },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return {
        color: "text-green-base",
        border: "border-green-base",
        bg: "bg-green-base/10",
        icon: Map,
      };
    case "IN_PROGRESS":
      return {
        color: "text-green-bright",
        border: "border-green-bright",
        bg: "bg-green-bright/10",
        icon: Activity,
      };
    case "FAILED":
      return {
        color: "text-danger-text",
        border: "border-danger-text",
        bg: "bg-danger-text/10",
        icon: Skull,
      };
    case "PENDING":
      return {
        color: "text-green-dim",
        border: "border-green-dim",
        bg: "bg-bg-screen",
        icon: Clock,
      };
    default:
      return {
        color: "text-green-mid",
        border: "border-green-mid",
        bg: "bg-bg-screen",
        icon: Target,
      };
  }
};

export function ExplorationsPage() {
  return (
    <div className="flex h-full w-full flex-col gap-4">
      <div className="flex flex-1 flex-col border-2 border-green-mid bg-bg-panel p-4 pb-2 sm:p-6">
        <header className="mb-6 flex items-start justify-between border-b border-dashed border-green-dim pb-4">
          <div>
            <h1 className="font-display text-lg sm:text-2xl text-green-hi tracking-widest uppercase mb-1 drop-shadow-glow-subtle">
              EXPEDITION_TRACKER{" "}
              <span className="text-green-base">// SAT_UPLINK</span>
            </h1>
            <p className="font-system text-xs text-green-dim uppercase">
              REAL-TIME TELEMETRY FEED // SECTOR_07
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 font-system text-xs text-green-bright uppercase animate-pulse">
            <RadioReceiver size={14} />
            <span>UPLINK: ACTIVE</span>
          </div>
        </header>

        <motion.ul
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="flex flex-col flex-1 gap-4 overflow-y-auto custom-scrollbar pr-2 min-h-0"
        >
          {DUMMY_EXPLORATIONS.map((exp) => {
            const config = getStatusConfig(exp.status);
            const Icon = config.icon;

            return (
              <motion.li
                key={exp.id}
                variants={staggerItem}
                className="flex items-center justify-between border border-green-mid bg-bg-deep pr-4 transition-colors hover:border-green-bright group"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className={`w-2 h-20 ${config.bg} border-r border-[#000]`}
                  ></div>
                  <div
                    className={`hidden sm:flex h-12 w-12 items-center justify-center border border-dashed ${config.border} ${config.bg}`}
                  >
                    <Icon size={20} className={config.color} />
                  </div>

                  <div className="flex flex-col flex-1 py-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h3
                        className={`font-display text-[10px] sm:text-xs uppercase tracking-wider ${config.color}`}
                      >
                        {exp.id}: {exp.destination}
                      </h3>
                      <span
                        className={`font-system text-[9px] px-1 py-[2px] uppercase ${config.bg} ${config.color} border ${config.border}`}
                      >
                        {exp.status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:gap-6 font-system text-[11px] text-green-mid uppercase">
                      <span className="flex items-center gap-1">
                        <span className="text-green-dim">UNIT:</span>{" "}
                        {exp.leadSurvivor}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-green-dim">TIME:</span> {exp.time}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  className={`shrink-0 border px-3 py-2 font-display text-[8px] uppercase transition-all ${config.border} ${config.color} hover:bg-green-mid/20 hover:shadow-glow-subtle`}
                >
                  {exp.action}
                </button>
              </motion.li>
            );
          })}
        </motion.ul>

        <footer className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-green-mid pt-4 font-system text-xs">
          <div className="flex flex-col justify-end bg-bg-deep border border-green-mid p-2">
            <span className="text-green-dim uppercase mb-2">
              UPLINK_BANDWIDTH
            </span>
            <div className="h-1 w-full bg-green-bright/20 relative mb-1">
              <div className="absolute top-0 left-0 w-[72%] h-full bg-green-bright"></div>
            </div>
            <span className="text-green-base text-right">
              72.4 kbps // STABLE
            </span>
          </div>

          <div className="flex flex-col justify-end bg-bg-deep border border-green-mid p-2">
            <span className="text-green-dim uppercase mb-2">THREAT_LEVEL</span>
            <div className="flex gap-[2px] h-2 w-full mb-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 ${i < 3 ? "bg-warn-text" : "bg-bg-screen border border-warn-text/30"}`}
                ></div>
              ))}
            </div>
            <span className="text-warn-text text-right">ELEVATED [3/5]</span>
          </div>

          <div className="flex flex-col justify-end items-end bg-bg-deep border border-green-mid p-2">
            <span className="text-green-dim uppercase mb-1">SYSTEM_CLOCK</span>
            <span className="font-display text-sm text-green-hi">
              23:14:09 <span className="text-[8px] text-green-dim">UTC-7</span>
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
