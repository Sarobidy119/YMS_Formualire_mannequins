/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        yms: {
          50: '#f9eeeb',
          100: '#efd3ca',
          500: '#842015',
          600: '#66150c',
          700: '#4b0d07',
          900: '#2c0804',
        },
      },
    },
  },
  plugins: [],
}
