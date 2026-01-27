/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-blue': '#2563eb',
        'brand-hover': '#1d4ed8',
        'brand-active': '#1e40af',
      },
    },
  },
  plugins: [],
}
