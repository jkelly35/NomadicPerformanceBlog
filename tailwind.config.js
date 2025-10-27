/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        utahRedrock: '#B9471E',
        utahSunset: '#FFB347',
        utahSky: '#7EC8E3',
        utahSage: '#A7C7A3',
        utahSandstone: '#F4E2D8',
      },
    },
  },
  plugins: [],
};
