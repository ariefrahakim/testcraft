import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: '#0E9C9C',
          dark: '#0B7E7E',
          light: '#D5EFEE',
          50: '#F0FDFD',
          100: '#D5EFEE',
          200: '#AADEDE',
          300: '#6ECECE',
          400: '#3DBEBE',
          500: '#0E9C9C',
          600: '#0B7E7E',
          700: '#086161',
          800: '#064747',
          900: '#032D2D',
        },
        navy: {
          DEFAULT: '#12283E',
          800: '#1E293B',
          700: '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'grad-hero': 'linear-gradient(135deg, #0F2438 0%, #16506B 55%, #0E9C9C 100%)',
        'grad-accent': 'linear-gradient(135deg, #0E9C9C, #2FBF9F)',
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15,23,42,.06), 0 8px 24px rgba(15,23,42,.07)',
        'card-lg': '0 8px 40px rgba(15,23,42,.14)',
      },
    },
  },
  plugins: [],
}

export default config
