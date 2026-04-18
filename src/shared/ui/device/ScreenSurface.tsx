import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function ScreenSurface({ children }: Props) {
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-md border-4 border-black bg-bg-screen p-4 shadow-inner crt-screen">
      <div className="relative z-0 flex h-full w-full flex-col text-green-base font-mono">
        {children}
      </div>
      <div className="crt-sweep"></div>
    </div>
  );
}
