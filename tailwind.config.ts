import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#121212',
        surfaceAlt: '#1A1A1A',
        primary: '#E50914',   // accent "Netflix"
        accent: '#1E90FF',    // action "Apple/Nike"
        text: '#F5F5F5',
        muted: '#A1A1AA',
        border: '#27272A'
      },
      borderRadius: { 
        xl: '1rem', 
        '2xl': '1.5rem' 
      },
      boxShadow: {
        card: '0 12px 32px -8px rgba(0,0,0,.45)',
        glow: '0 0 18px rgba(229,9,20,.35)'
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif']
      },
      transitionTimingFunction: { 
        cine: 'cubic-bezier(.2,.8,.2,1)' 
      },
    }
  },
  plugins: [],
};

export default config;