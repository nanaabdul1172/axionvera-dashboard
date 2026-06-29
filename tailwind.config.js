const tokens = require('./src/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/pages/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        // next/font injects these CSS custom properties at the element that
        // carries the `.variable` className (the root <div> in _app.tsx).
        // Tailwind's font-sans and font-mono utilities will pick them up,
        // falling back gracefully when the variable isn't defined.
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        background: {
          primary: 'var(--token-color-background-primary)',
          secondary: 'var(--token-color-background-secondary)',
          tertiary: 'var(--token-color-background-tertiary)',
        },
        text: {
          primary: 'var(--token-color-text-primary)',
          secondary: 'var(--token-color-text-secondary)',
          muted: 'var(--token-color-text-muted)',
          tertiary: 'var(--token-color-text-tertiary)',
        },
        border: {
          primary: 'var(--token-color-border-primary)',
          secondary: 'var(--token-color-border-secondary)',
          tertiary: 'var(--token-color-border-tertiary)',
          focus: 'var(--token-color-border-focus)',
        },
        brand: {
          primary: 'var(--token-color-brand-primary)',
          secondary: 'var(--token-color-brand-secondary)',
          contrast: 'var(--token-color-brand-contrast)',
          subtle: 'var(--token-color-brand-subtle)',
        },
        status: {
          danger: 'var(--token-color-status-danger)',
          dangerSubtle: 'var(--token-color-status-dangerSubtle)',
          success: 'var(--token-color-status-success)',
          successSubtle: 'var(--token-color-status-successSubtle)',
          warning: 'var(--token-color-status-warning)',
          warningSubtle: 'var(--token-color-status-warningSubtle)',
          info: 'var(--token-color-status-info)',
          infoSubtle: 'var(--token-color-status-infoSubtle)',
        },
        theme: {
          bg: {
            primary: 'var(--token-color-background-primary)',
            secondary: 'var(--token-color-background-secondary)',
          },
          text: {
            primary: 'var(--token-color-text-primary)',
            secondary: 'var(--token-color-text-secondary)',
          },
          border: {
            primary: 'var(--token-color-border-primary)',
            focus: 'var(--token-color-border-focus)',
          },
          accent: 'var(--token-color-brand-primary)'
        },
        axion: tokens.base.color.axion,
      },
      spacing: tokens.base.spacing,
      borderRadius: tokens.base.radius,
      boxShadow: tokens.base.shadow,
      zIndex: tokens.base.zIndex,
      transitionDuration: tokens.base.transition.duration,
      transitionTimingFunction: tokens.base.transition.easing,
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
    }
  },
  plugins: []
};
