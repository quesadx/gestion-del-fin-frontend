/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gdf: {
          surface: {
            root: 'var(--gdf-surface-root)',
            base: 'var(--gdf-surface-base)',
            raised: 'var(--gdf-surface-raised)',
            overlay: 'var(--gdf-surface-overlay)',
            hover: 'var(--gdf-surface-hover)',
          },
          text: {
            primary: 'var(--gdf-text-primary)',
            secondary: 'var(--gdf-text-secondary)',
            muted: 'var(--gdf-text-muted)',
            inverse: 'var(--gdf-text-inverse)',
          },
          border: {
            subtle: 'var(--gdf-border-subtle)',
            DEFAULT: 'var(--gdf-border-default)',
            hover: 'var(--gdf-border-hover)',
            active: 'var(--gdf-border-active)',
          },
          accent: {
            primary: 'var(--gdf-accent-primary)',
            'primary-dim': 'var(--gdf-accent-primary-dim)',
            secondary: 'var(--gdf-accent-secondary)',
          },
          status: {
            danger: 'var(--gdf-status-danger)',
            warning: 'var(--gdf-status-warning)',
            success: 'var(--gdf-status-success)',
            info: 'var(--gdf-status-info)',
          },
          glass: {
            bg: 'var(--gdf-glass-bg)',
            'bg-hover': 'var(--gdf-glass-bg-hover)',
            'bg-heavy': 'var(--gdf-glass-bg-heavy)',
            border: 'var(--gdf-glass-border)',
            'border-hover': 'var(--gdf-glass-border-hover)',
          },
        },
        background: 'var(--gdf-surface-root)',
        foreground: 'var(--gdf-text-primary)',
        card: 'var(--gdf-surface-raised)',
        'card-foreground': 'var(--gdf-text-primary)',
        muted: 'var(--gdf-surface-overlay)',
        'muted-foreground': 'var(--gdf-text-muted)',
        input: 'var(--gdf-surface-base)',
        ring: 'var(--gdf-accent-primary)',
        destructive: 'var(--gdf-status-danger)',
        'destructive-foreground': 'var(--gdf-text-inverse)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backdropBlur: {
        glass: 'var(--gdf-glass-blur)',
        'glass-heavy': 'var(--gdf-glass-blur-heavy)',
      },
      keyframes: {
        'float-panel': 'float-panel 4s ease-in-out infinite alternate',
      'ripple': { '0%': { transform: 'scale(0)', opacity: '0.4' }, '100%': { transform: 'scale(4)', opacity: '0' } },
      'ripple': 'ripple 0.6s ease-out forwards',
      'grid-drift': { '0%': { backgroundPosition: '0 0' }, '100%': { backgroundPosition: '60px 60px' } },
      'grid-drift': 'grid-drift 30s linear infinite',
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        'float-panel': {
      'ripple': { '0%': { transform: 'scale(0)', opacity: '0.4' }, '100%': { transform: 'scale(4)', opacity: '0' } },
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(3px)' },
        },
        'float-panel': {
      'ripple': { '0%': { transform: 'scale(0)', opacity: '0.4' }, '100%': { transform: 'scale(4)', opacity: '0' } },
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(3px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        'scanner-sweep': {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'glitch-shift': {
          '0%': { transform: 'translateX(0)' },
          '10%': { transform: 'translateX(-2px)' },
          '20%': { transform: 'translateX(2px)' },
          '30%': { transform: 'translateX(-1px)' },
          '40%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(0)' },
        },
        'ambient-drift-1': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(5%, -3%) scale(1.1)' },
        },
        'ambient-drift-2': {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(-4%, 2%) scale(1.08)' },
        },
      },
      animation: {
        'float-panel': 'float-panel 4s ease-in-out infinite alternate',
      'ripple': { '0%': { transform: 'scale(0)', opacity: '0.4' }, '100%': { transform: 'scale(4)', opacity: '0' } },
      'ripple': 'ripple 0.6s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.35s ease-out forwards',
        'slide-in-right': 'slide-in-right 0.3s ease-out forwards',
        blink: 'blink 1.2s step-end infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scanner-sweep': 'scanner-sweep 3s linear infinite',
        breathe: 'breathe 3s ease-in-out infinite',
        'glitch-shift': 'glitch-shift 0.3s ease-in-out',
        'ambient-drift-1': 'ambient-drift-1 20s ease-in-out infinite alternate',
        'ambient-drift-2': 'ambient-drift-2 25s ease-in-out infinite alternate-reverse',
      },
    },
  },
  plugins: [],
};
