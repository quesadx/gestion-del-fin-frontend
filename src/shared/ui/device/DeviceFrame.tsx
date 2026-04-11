import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Outer hardware casing for the military terminal.
 * Creates the dark plastic/metal bezel and decorative screws.
 */
export function DeviceFrame({ children }: Props) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-black p-2 md:p-6 lg:p-10">
      {/*
        The Bezel: Dark casing with a subtle top highlight
        and rounded tactical corners. Uses max-width so it
        looks like a device on large screens.
      */}
      <div className="relative flex h-full w-full max-w-6xl flex-col rounded-2xl border-t-2 border-t-bezel-hi bg-bezel p-3 shadow-2xl md:p-6">
        {/* Decorative Screws (Top Left, Top Right, Bottom Left, Bottom Right) */}
        <div className="absolute left-3 top-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />
        <div className="absolute right-3 top-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />
        <div className="absolute bottom-3 left-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />
        <div className="absolute bottom-3 right-3 h-3 w-3 rounded-full bg-screw border border-black shadow-inner" />

        {/* This is where the glass screen will be inserted */}
        {children}
      </div>
    </div>
  );
}
