import DarkVeil from './DarkVeil';

export default function AppBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-surface-base">
      <DarkVeil
        hueShift={356}
        noiseIntensity={0.04}
        scanlineIntensity={0}
        speed={0.78}
        scanlineFrequency={0.5}
        warpAmount={1.18}
        resolutionScale={1}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.11)_0%,_transparent_38%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.025)_0%,_transparent_30%),linear-gradient(180deg,_rgba(0,0,0,0.28),_rgba(0,0,0,0.88))]" />
    </div>
  );
}