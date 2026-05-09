import { useEffect, useState } from "react";

export function WaveBackground() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setOffset({ x, y });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base dark layer */}
      <div className="absolute inset-0" style={{ background: "oklch(0.08 0.03 320)" }} />

      {/* Animated blurry blobs */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
          transition: "transform 0.6s ease-out",
        }}
      >
        <div className="wave-blob wave-blob-1" />
        <div className="wave-blob wave-blob-2" />
        <div className="wave-blob wave-blob-3" />
        <div className="wave-blob wave-blob-4" />
      </div>

      <div
        className="absolute -inset-[5%] grid-overlay opacity-60"
        style={{
          transform: `translate3d(${offset.x * -0.5}px, ${offset.y * -0.5}px, 0)`,
          transition: "transform 0.6s ease-out",
        }}
      />
      {/* Animated scan line */}
      <div
        className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-[oklch(0.85_0.22_200_/_0.6)] to-transparent"
        style={{
          animation: "scan 6s linear infinite",
          boxShadow: "0 0 12px oklch(0.85 0.22 200 / 0.7)",
        }}
      />
      {/* Scanlines overlay */}
      <div className="absolute inset-0 scanlines" />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, oklch(0.05 0.03 320 / 0.7) 100%)",
        }}
      />
    </div>
  );
}
