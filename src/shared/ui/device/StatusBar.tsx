import { Battery, Wifi } from "lucide-react";

export function StatusBar() {
  return (
    <header className="mb-6 flex shrink-0 items-center justify-between border-b-2 border-b-green-mid pb-2 font-display text-xs text-green-bright uppercase uppercase tracking-wider shadow-glow-subtle">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Wifi className="h-4 w-4 animate-pulse" />
          <span className="hidden sm:inline">UPLINK</span>
        </div>
        <div className="flex items-center gap-1 opacity-80">
          <Battery className="h-4 w-4" />
          <span className="hidden sm:inline">98%</span>
        </div>
      </div>

      <div className="text-center font-bold">
        <span>CAMPAMENTO OMEGA</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden sm:inline text-green-base text-[10px]">
          TIME /
        </span>
        <span className="animate-pulse">15:42:01</span>
      </div>
    </header>
  );
}
