/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0F0F10',
        surface: '#141415',
        surface2: '#1A1A1C',
        edge: '#2A2A2E',
        edge2: '#1F1F21',
        accent: '#EAB308',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}


