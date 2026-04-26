/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'material-icons': ['Material Icons'],
      },
      colors: {
        // Paleta unificada con CSS variables para dark/light
        surface: {
          DEFAULT: 'rgb(var(--surface))',
          dim: 'rgb(var(--surface-dim))',
          bright: 'rgb(var(--surface-bright))',
          lowest: 'rgb(var(--surface-lowest))',
          low: 'rgb(var(--surface-low))',
          container: 'rgb(var(--surface-container))',
          high: 'rgb(var(--surface-high))',
          highest: 'rgb(var(--surface-highest))',
        },
        'on-surface': 'rgb(var(--on-surface))',
        'on-surface-variant': 'rgb(var(--on-surface-variant))',
        outline: 'rgb(var(--outline))',
        'outline-variant': 'rgb(var(--outline-variant))',
        'surface-tint': 'rgb(var(--surface-tint))',
        primary: {
          DEFAULT: 'rgb(var(--primary))',
          container: 'rgb(var(--primary-container))',
          fixed: 'rgb(var(--primary-fixed))',
          'fixed-dim': 'rgb(var(--primary-fixed-dim))',
        },
        'on-primary': {
          DEFAULT: 'rgb(var(--on-primary))',
          container: 'rgb(var(--on-primary-container))',
          fixed: 'rgb(var(--on-primary-fixed))',
          'fixed-variant': 'rgb(var(--on-primary-fixed-variant))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary))',
          container: 'rgb(var(--secondary-container))',
          fixed: 'rgb(var(--secondary-fixed))',
          'fixed-dim': 'rgb(var(--secondary-fixed-dim))',
        },
        'on-secondary': {
          DEFAULT: 'rgb(var(--on-secondary))',
          container: 'rgb(var(--on-secondary-container))',
          fixed: 'rgb(var(--on-secondary-fixed))',
          'fixed-variant': 'rgb(var(--on-secondary-fixed-variant))',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--tertiary))',
          container: 'rgb(var(--tertiary-container))',
          fixed: 'rgb(var(--tertiary-fixed))',
          'fixed-dim': 'rgb(var(--tertiary-fixed-dim))',
        },
        'on-tertiary': {
          DEFAULT: 'rgb(var(--on-tertiary))',
          container: 'rgb(var(--on-tertiary-container))',
          fixed: 'rgb(var(--on-tertiary-fixed))',
          'fixed-variant': 'rgb(var(--on-tertiary-fixed-variant))',
        },
        error: {
          DEFAULT: 'rgb(var(--error))',
          container: 'rgb(var(--error-container))',
        },
        'on-error': {
          DEFAULT: 'rgb(var(--on-error))',
          container: 'rgb(var(--on-error-container))',
        },
        inverse: {
          surface: 'rgb(var(--inverse-surface))',
          onSurface: 'rgb(var(--inverse-on-surface))',
          primary: 'rgb(var(--inverse-primary))',
        },
        background: 'rgb(var(--background))',
        'on-background': 'rgb(var(--on-background))',
        'surface-variant': 'rgb(var(--surface-variant))',
        // Status colors
        status: {
          pendiente: 'rgb(var(--status-pendiente))',
          'pendiente-bg': 'rgb(var(--status-pendiente-bg))',
          'pendiente-border': 'rgb(var(--status-pendiente-border))',
          despachado: 'rgb(var(--status-despachado))',
          'despachado-bg': 'rgb(var(--status-despachado-bg))',
          'despachado-border': 'rgb(var(--status-despachado-border))',
          entregado: 'rgb(var(--status-entregado))',
          'entregado-bg': 'rgb(var(--status-entregado-bg))',
          'entregado-border': 'rgb(var(--status-entregado-border))',
        },
      },
      // Typography
      fontSize: {
        h1: ['30px', { lineHeight: '38px', letterSpacing: '-0.02em', fontWeight: '700' }],
        h2: ['24px', { lineHeight: '32px', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', letterSpacing: '0', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', letterSpacing: '0', fontWeight: '400' }],
        'label-caps': ['12px', { lineHeight: '16px', letterSpacing: '0.05em', fontWeight: '600' }],
        'data-mono': ['14px', { lineHeight: '20px', letterSpacing: '-0.01em', fontWeight: '500' }],
      },
      // Border Radius
      borderRadius: {
        DEFAULT: '0.125rem',
        sm: '0.125rem',
        lg: '0.25rem',
        xl: '0.5rem',
        full: '0.75rem',
      },
      // Spacing
      spacing: {
        unit: '4px',
        gutter: '24px',
        'section-gap': '48px',
        'container-margin': '32px',
        'component-padding-x': '16px',
        'component-padding-y': '12px',
      },
      // Custom background pattern for grid dots
      backgroundImage: {
        'grid-dot': 'radial-gradient(#334155 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid-dot': '24px 24px',
      },
    },
  },
  plugins: [],
};