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
        manrope: ['Manrope', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
        'data-mono': ['Inter', 'sans-serif'],
      },
      // Colors - Slate Precision Dark Mode
      colors: {
        surface: {
          DEFAULT: '#081425',
          dim: '#081425',
          bright: '#2f3a4c',
          lowest: '#040e1f',
          low: '#111c2d',
          container: '#152031',
          high: '#1f2a3c',
          highest: '#2a3548',
        },
        'on-surface': '#d8e3fb',
        'on-surface-variant': '#bdc8d1',
        outline: '#87929a',
        'outline-variant': '#3e484f',
        'surface-tint': '#7bd0ff',
        // Primary - Sky Blue
        primary: {
          DEFAULT: '#8ed5ff',
          container: '#38bdf8',
          fixed: '#c4e7ff',
          'fixed-dim': '#7bd0ff',
        },
        'on-primary': {
          DEFAULT: '#00354a',
          container: '#004965',
          fixed: '#001e2c',
          'fixed-variant': '#004c69',
        },
        // Secondary
        secondary: {
          DEFAULT: '#b9c8de',
          container: '#39485a',
          fixed: '#d4e4fa',
          'fixed-dim': '#b9c8de',
        },
        'on-secondary': {
          DEFAULT: '#233143',
          container: '#a7b6cc',
          fixed: '#0d1c2d',
          'fixed-variant': '#39485a',
        },
        // Tertiary
        tertiary: {
          DEFAULT: '#c5cce6',
          container: '#a9b1ca',
          fixed: '#dae2fd',
          'fixed-dim': '#bec6e0',
        },
        'on-tertiary': {
          DEFAULT: '#283044',
          container: '#3c4459',
          fixed: '#131b2e',
          'fixed-variant': '#3f465c',
        },
        // Error
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        'on-error': {
          DEFAULT: '#690005',
          container: '#ffdad6',
        },
        // Inverse
        inverse: {
          surface: '#d8e3fb',
          onSurface: '#263143',
          primary: '#00668a',
        },
        // Background
        background: '#081425',
        'on-background': '#d8e3fb',
        'surface-variant': '#2a3548',
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