/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'jersey': ['var(--font-jersey)', 'Jersey', 'serif'],
      },
      colors: {
        'simulation': {
          'bg': '#08090A',
          'green': '#BEFFC6',
        },
        'gray': {
          'line': '#515255',
          'thin': '#2B2C2D',
        },
      },
    },
  },
  plugins: [],
}