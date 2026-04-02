import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Inner curved CRT screen component.
 * Uses the global '.crt-screen' utility class from scanlines.css
 * and applies the base phosphor green typography.
 */
export function ScreenSurface({ children }: Props) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md border-4 border-black bg-bg-screen p-4 shadow-inner crt-screen">
      {/* 
        This wrapper creates the subtle glow and noise effect 
        and ensures typography defaults to the Share Tech Mono font.
      */}
      <div className="relative z-0 flex h-full w-full flex-col text-green-base font-mono">
        {children}
      </div>
    </div>
  );
}
