/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#10265F',
          indigo: '#4655CA',
          electric: '#3878FC',
          cyan: '#0EA5DE',
          violet: '#6844FC',
          royal: '#285ED8',
          ocean: '#006394',
          deep: '#082050',
          bg: '#080B18',
          card: '#11182A',
          surface: '#17213A',
          border: '#263451',
          text: '#FFFFFF',
          muted: '#A5B0C8',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
        }
      }
    },
  },
  plugins: [],
}