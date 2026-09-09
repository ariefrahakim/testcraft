import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    // Container terpusat dengan padding yang naik bertahap di layar besar.
    container: {
      center: true,
      padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        // Token diselaraskan dengan website perusahaan (teal + navy)
        // agar LMS, CMS, dan situs marketing tampak satu keluarga.
        primary: {
          DEFAULT: '#0E9C9C',
          dark: '#0B7E7E',
          light: '#D5EFEE',
          50: '#F0FAFA',
          600: '#0E9C9C',
          700: '#0B7E7E',
        },
        navy: { DEFAULT: '#12283E', 900: '#0F2438', 800: '#1E293B', 700: '#334155' },
        ink: { DEFAULT: '#12283E', 2: '#475569', 3: '#94A3B8' },
        surface: '#F8FAFC',
        success: { DEFAULT: '#10B981', light: '#D1FAE5' },
        warning: { DEFAULT: '#F59E0B', light: '#FEF3C7' },
        danger: { DEFAULT: '#EF4444', light: '#FEE2E2' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '16px', sm2: '10px' },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg,#0F2438 0%,#16506B 55%,#0E9C9C 100%)',
        'brand-accent': 'linear-gradient(135deg,#0E9C9C,#2FBF9F)',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.07)',
        lift: '0 8px 40px rgba(15,23,42,.14)',
      },
      keyframes: {
        'slide-in': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'slide-in': 'slide-in .22s ease-out',
        'fade-in': 'fade-in .2s ease-out',
        'enter': 'enter 0.3s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
