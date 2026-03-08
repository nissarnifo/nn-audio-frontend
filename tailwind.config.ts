import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0E1A',
        bg2: '#0D1B2A',
        cyan: '#00D4FF',
        gold: '#FFB700',
        green: '#00FF88',
        red: '#FF3366',
        'text-primary': '#E8F4FD',
        muted: '#4A7FA5',
        border: 'rgba(0,212,255,0.18)',
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        body: ['"Exo 2"', 'sans-serif'],
      },
      animation: {
        fadeup: 'fadeup 0.5s ease-out',
        cyanglow: 'cyanglow 2s ease-in-out infinite',
        shimmer: 'shimmer 0.6s ease-in-out',
      },
      keyframes: {
        fadeup: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cyanglow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0,212,255,0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(0,212,255,0.8)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
