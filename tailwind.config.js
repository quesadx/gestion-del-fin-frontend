/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          base: "#0a0a0a",
          glass: "#171717",
          deep: "#0a0a0a",
          raised: "#171717",
          overlay: "#262626",
        },
        accent: {
          primary: "#ef4444",
          "primary-dim": "#dc2626",
          secondary: "#f59e0b",
          success: "#10b981",
        },
        text: {
          primary: "#f4f4f5",
          secondary: "#a1a1aa",
          muted: "#71717a",
        },
        border: {
          subtle: "#27272a",
          DEFAULT: "#3f3f46",
          hover: "#52525b",
          active: "#71717a",
        },
        status: {
          green: "#10b981",
          red: "#ef4444",
          yellow: "#f59e0b",
        },
        brand: {
          primary: "#ef4444",
          secondary: "#f59e0b",
          accent: "#10b981",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
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
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-up": "slide-up 0.35s ease-out forwards",
        "slide-in-right": "slide-in-right 0.3s ease-out forwards",
        blink: "blink 1.2s step-end infinite",
      },
    },
  },
  plugins: [],
};
