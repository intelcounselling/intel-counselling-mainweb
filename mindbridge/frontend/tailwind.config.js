/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Serene Green
        primary: {
          50:  '#edf4f2',
          100: '#d1e4de',
          200: '#a8cdc4',
          300: '#76aea2',
          400: '#4c8d7f',
          500: '#327265',
          600: '#235a4f',
          700: '#1e4941',
          800: '#1C3F39', // Brand Serene Green
          900: '#17332f',
          950: '#0c1d1a',
        },
        // Brass / Terracotta
        accent: {
          50:  '#fdfaf5',
          100: '#faeedb',
          200: '#f3dbb3',
          300: '#eac284',
          400: '#dfa35b',
          500: '#d68b3c',
          600: '#C19B6C', // Brand Brass
          700: '#aa6022',
          800: '#8a4d21',
          900: '#6f401f',
        },
        // Surface / Warm Parchment & Dark Charcoal
        surface: {
          50:  '#F4EFE6', // Base background
          100: '#e9e3d9',
          200: '#d6cdbd',
          300: '#c0b4a0',
          400: '#a79a83',
          500: '#8f8269',
          600: '#736650',
          700: '#5c503d',
          800: '#2A2825', // Section Dark
          900: '#1A1A1A', // Primary Dark
          950: '#111111',
        },
        // Severity
        severity: {
          minimal: '#16a34a',
          mild:    '#ca8a04',
          moderate:'#ea580c',
          severe:  '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(79, 70, 229, 0.12)',
        'card':  '0 2px 8px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 8px 24px rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-right': 'slideRight 0.25s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideRight: {
          '0%':   { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
