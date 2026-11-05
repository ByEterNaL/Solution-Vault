/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Surface ladder — deep dark with subtle warmth
        bg: {
          base: '#0a0a0f',
          subtle: '#0f0f17',
          surface: '#16161f',
          elevated: '#1c1c28',
          overlay: '#22222f'
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          default: 'rgba(255,255,255,0.10)',
          strong: 'rgba(255,255,255,0.16)'
        },
        text: {
          primary: '#e6e6ee',
          secondary: '#a8a8b8',
          tertiary: '#6e6e80',
          disabled: '#4a4a58'
        },
        accent: {
          50: '#eef0ff',
          100: '#e0e3ff',
          200: '#c7ccff',
          300: '#a5acff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81'
        },
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace'
        ]
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        '2xl': '16px'
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.20), 0 0 0 1px rgba(255,255,255,0.04)',
        elevated:
          '0 8px 24px -4px rgba(0,0,0,0.5), 0 4px 8px -2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.06)',
        glow: '0 0 0 1px rgba(129,140,248,0.4), 0 0 24px -4px rgba(129,140,248,0.35)'
      },
      backdropBlur: {
        xs: '2px'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'slide-up': 'slide-up 180ms ease-out',
        'scale-in': 'scale-in 150ms ease-out'
      }
    }
  },
  plugins: []
}
