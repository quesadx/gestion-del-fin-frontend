import { DeviceFrame, ScreenSurface, StatusBar } from "@/shared/ui/device";

function App() {
  return (
    <DeviceFrame>
      <ScreenSurface>
        <StatusBar /> {/* Contenido temporal de prueba */}
        <div className="flex flex-col h-full bg-panel p-6 border-thin rounded-md">
          <h1 className="text-green-hi text-2xl font-display mb-4 pb-2 border-b border-green-dim">
            [SYSTEM DIAGNOSTICS V1.0]
          </h1>

          <ul className="space-y-4 text-green-base font-mono">
            <li className="flex items-center gap-2">
              <span className="text-green-bright animate-pulse">▶</span>
              React 18: Operational
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-bright animate-pulse">▶</span>
              Tailwind CSS: Operational
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-bright animate-pulse">▶</span>
              Device Layout: ONLINE
            </li>
          </ul>

          <div className="mt-auto">
            <p className="text-xs text-green-dim font-system uppercase tracking-widest animate-pulse">
              Awaiting connection from Front A module...
            </p>
          </div>
        </div>
      </ScreenSurface>
    </DeviceFrame>
  );
}

export default App;
