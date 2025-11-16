/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        orange: {
          50: '#FEF3F2',
          100: '#FEE7E4',
          200: '#FDD3CE',
          300: '#FCB5AB',
          400: '#F56B4C', // rgba(245, 107, 76, 1)
          500: '#F04822',
          600: '#DD3618',
          700: '#BA2B16',
          800: '#9A2618',
          900: '#80251A',
        },
      },
    },
  },
  plugins: [],
}
