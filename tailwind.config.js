/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Estos nombres deben coincidir con tu DESIGN_SYSTEM.md
        'terminal-green': {
          bright: '#4dbd57',
          base: '#3d8b46',
          dim: '#1a3d1f',
        },
        'terminal-black': '#020f04',
        'terminal-panel': '#041508',
        'terminal-danger': '#8b1a1a',
      },
      fontFamily: {
        // Las fuentes que definimos para el "dispositivo táctico"
        'display': ['"Press Start 2P"', 'cursive'],
        'mono': ['"Share Tech Mono"', 'monospace'],
        'system': ['VT323', 'monospace'],
      },
      backgroundImage: {
        // Para el efecto de scanlines/CRT que pide el diseño
        'crt-lines': "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))",
      },
    },
  },
  plugins: [],
}