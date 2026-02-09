/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDB766',
          400: '#ff8800', // rgba(255, 136, 0, 1)
          500: '#e67a00',
          600: '#cc6d00',
          700: '#b36100',
          800: '#8a4b00',
          900: '#663800',
        },
      },
    },
  },
  plugins: [],
}
