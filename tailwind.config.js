/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-deep": "var(--clr-bg-deep)",
        "bg-screen": "var(--clr-bg-screen)",
        "bg-panel": "var(--clr-bg-panel)",
        "green-dim": "var(--clr-green-dim)",
        "green-mid": "var(--clr-green-mid)",
        "green-base": "var(--clr-green-base)",
        "green-bright": "var(--clr-green-bright)",
        "green-hi": "var(--clr-green-hi)",
        "green-max": "var(--clr-green-max)",
        danger: "var(--clr-danger)",
        "danger-text": "var(--clr-danger-text)",
        "warn-text": "var(--clr-warn-text)",
        bezel: "var(--clr-bezel)",
      },
      fontFamily: {
        display: ['"Press Start 2P"', "monospace"],
        mono: ['"Share Tech Mono"', "monospace"],
        system: ["VT323", "monospace"],
      },
      boxShadow: {
        "glow-text": "var(--glow-text)",
        "glow-strong": "var(--glow-strong)",
        "glow-subtle": "var(--glow-subtle)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
      },
    },
  },
  plugins: [],
};
