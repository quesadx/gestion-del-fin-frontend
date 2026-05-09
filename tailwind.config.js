/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        warning: "var(--warning)",
        "warning-foreground": "var(--warning-foreground)",

        neon: {
          fuchsia: "var(--neon-fuchsia)",
          cyan: "var(--neon-cyan)",
          violet: "var(--neon-violet)",
          yellow: "var(--neon-yellow)",
        },
        deep: {
          magenta: "var(--deep-magenta)",
          charcoal: "var(--charcoal)",
        },
      },
      fontFamily: {
        display: ["Orbitron", "sans-serif"],
        tech: ["Rajdhani", "sans-serif"],
        "mono-data": ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: {
          fuchsia: "var(--glow-fuchsia)",
          cyan: "var(--glow-cyan)",
          yellow: "var(--glow-yellow)",
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
      },
      // ── Subtle animations ──
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "scan-down": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "breath": {
          "0%, 100%": { boxShadow: "var(--glow-fuchsia)" },
          "50%": { boxShadow: "0 0 8px oklch(0.68 0.32 340 / 0.3)" },
        },
        "drift-x": {
          "0%": { transform: "translateX(0)" },
          "50%": { transform: "translateX(6px)" },
          "100%": { transform: "translateX(0)" },
        },
        "corner-breathe": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "scan-down": "scan-down 6s linear infinite",
        "breath": "breath 3s ease-in-out infinite",
        "drift-x": "drift-x 4s ease-in-out infinite",
        "corner-breathe": "corner-breathe 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
