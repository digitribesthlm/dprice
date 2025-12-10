/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx,mdx}',
    './components/**/*.{js,jsx,mdx}',
    './app/**/*.{js,jsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // dPrice brand colors
        priceGreen: '#059669',
        priceTeal: '#0d9488',
        priceSlate: '#334155',
        priceGray: '#f8fafc',
      },
    },
  },
  plugins: [],
}



