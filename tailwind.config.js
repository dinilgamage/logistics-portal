/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          100: '#0098e6',   // primary
          80:  '#0080c0',   // hover
          10:  '#002e44'    // darkest
        }
      }
    }
  },
  plugins: []
};
