/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf6f0',
          100: '#f3eadc',
          200: '#e7d6bb',
        },
      },
    },
  },
  plugins: [],
};
