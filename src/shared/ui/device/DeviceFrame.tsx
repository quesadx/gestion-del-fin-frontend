import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DeviceFrame({ children }: Props) {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-black sm:p-2 md:p-4 opacity-100">
      <div className="relative flex h-full w-full max-w-screen-2xl flex-col sm:rounded-xl md:rounded-2xl border-t-2 border-t-bezel-hi bg-bezel p-2 sm:p-3 shadow-2xl md:p-5">
        <div className="absolute left-3 top-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />
        <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />
        <div className="absolute bottom-3 left-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />
        <div className="absolute bottom-3 right-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />

        {children}
      </div>
    </div>
  );
}
