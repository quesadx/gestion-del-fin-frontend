import { TestComponent } from "@/shared/ui/TestComponent";

function App() {
  return (
    <div className="min-h-screen bg-terminal-black p-10 font-mono">
      <h1 className="text-terminal-green-bright text-2xl border-b border-terminal-green-dim mb-4">
        [SYSTEM DIAGNOSTICS V1.0]
      </h1>
      <ul className="space-y-2 text-terminal-green-base">
        <li>✅ React 18: Operational</li>
        <li>✅ Tailwind CSS: Operational</li>
        <li>
          ✅ Alias @/: <TestComponent />
        </li>
      </ul>
      <p className="mt-8 text-xs text-terminal-green-dim animate-pulse">
        If you see this text in green with terminal font, your configuration is
        CORRECT.
      </p>
    </div>
  );
}

export default App;
