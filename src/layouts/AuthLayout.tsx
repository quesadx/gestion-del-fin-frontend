import { Outlet } from 'react-router-dom';
import DarkVeil from '../components/backgrounds/DarkVeil';

export default function AuthLayout() {
  return (
    <div className="min-h-screen grid place-items-center bg-surface-base relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <DarkVeil
          hueShift={356}
          noiseIntensity={0.04}
          scanlineIntensity={0}
          speed={0.78}
          scanlineFrequency={0.5}
          warpAmount={1.18}
          resolutionScale={1}
        />
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.11)_0%,_transparent_38%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.025)_0%,_transparent_30%),linear-gradient(180deg,_rgba(0,0,0,0.28),_rgba(0,0,0,0.88))]" />
      <main className="relative z-10 w-full max-w-md px-6">
        <Outlet />
      </main>
    </div>
  );
}
