import DarkVeil from './DarkVeil';

export default function AppBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-surface-base"
      aria-hidden="true"
    >
      <DarkVeil
        hueShift={56}
        noiseIntensity={0.03}
        scanlineIntensity={0}
        speed={0.68}
        scanlineFrequency={0.5}
        warpAmount={1.5}
        resolutionScale={1}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(239,68,68,0.12),transparent_34%),radial-gradient(circle_at_82%_74%,rgba(245,158,11,0.06),transparent_30%),radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_42%)] background-drift" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.11)_0%,_transparent_38%),radial-gradient(circle_at_bottom,_rgba(255,255,255,0.025)_0%,_transparent_30%),linear-gradient(180deg,_rgba(0,0,0,0.28),_rgba(0,0,0,0.88))]" />
    </div>
  );
}
