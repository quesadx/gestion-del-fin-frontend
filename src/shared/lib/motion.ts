import type { Variants, Transition } from "framer-motion";

export const crtOn: Variants = {
  initial: { scaleY: 0.01, opacity: 0 },
  animate: {
    scaleY: 1,
    opacity: 1,
    transition: { duration: 0.8, ease: [0.23, 1, 0.32, 1] },
  },
};
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
};

export const glitch: Variants = {
  animate: {
    x: [0, -2, 2, -1, 1, 0],
    opacity: [1, 0.8, 1, 0.9, 1],
    transition: { duration: 0.3, times: [0, 0.2, 0.4, 0.6, 0.8, 1] },
  },
};

export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.05 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};
export const scanlineSweep: { animate: object; transition: Transition } = {
  animate: { y: ["-100%", "100%"] },
  transition: { duration: 3, repeat: Infinity, ease: "linear" },
};

export const cursorBlink: Variants = {
  animate: {
    opacity: [1, 0, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "linear",
      times: [0, 0.5, 1],
    },
  },
};
