/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "oklch(0.07 0.01 255)",
          glass: "oklch(0.12 0.015 255 / 0.65)",
          deep: "oklch(0.08 0.01 255 / 0.7)",
        },
        accent: {
          primary: "oklch(0.65 0.28 210)",
          "primary-dim": "oklch(0.5 0.22 210)",
          secondary: "oklch(0.55 0.25 280)",
        },
        text: {
          primary: "oklch(0.96 0.01 260)",
          secondary: "oklch(0.7 0.05 210)",
          muted: "oklch(0.5 0.03 240)",
        },
        border: {
          subtle: "oklch(0.55 0.22 210 / 0.12)",
          DEFAULT: "oklch(0.55 0.22 210 / 0.2)",
          hover: "oklch(0.55 0.22 210 / 0.4)",
          active: "oklch(0.55 0.22 210 / 0.6)",
        },
        status: {
          green: "#00e676",
          red: "#ff3355",
          yellow: "#ffab00",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backdropBlur: {
        glass: "18px",
        heavy: "28px",
        light: "10px",
      },
      boxShadow: {
        glass: "0 4px 32px oklch(0 0 0 / 0.5), 0 1px 0 oklch(1 0 0 / 0.04) inset",
        "glass-heavy": "0 8px 48px oklch(0 0 0 / 0.65), 0 1px 0 oklch(1 0 0 / 0.05) inset",
        "glass-light": "0 2px 16px oklch(0 0 0 / 0.35)",
        glow: "0 0 18px oklch(0.65 0.28 210 / 0.5), 0 0 40px oklch(0.65 0.28 210 / 0.2)",
        "glow-purple": "0 0 18px oklch(0.55 0.25 280 / 0.5)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        breathe: {
          "0%, 100%": { boxShadow: "0 4px 32px oklch(0 0 0 / 0.5)" },
          "50%": { boxShadow: "0 4px 32px oklch(0 0 0 / 0.5), 0 0 24px oklch(0.65 0.28 210 / 0.25)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.35s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        breathe: "breathe 4s ease-in-out infinite",
        blink: "blink 1.2s step-end infinite",
      },
    },
  },
  plugins: [],
};
