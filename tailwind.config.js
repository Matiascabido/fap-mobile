/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#DC2626', // red-600
          dark: '#991B1B', // red-800
        },
        slate: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        success: '#10B981', // green-500
        warning: '#F59E0B', // amber-500
        error: '#EF4444', // red-500
        info: '#3B82F6', // blue-500
      },
      fontFamily: {
        // En React Native, las fuentes del sistema se usan automáticamente
      },
    },
  },
  plugins: [],
};
