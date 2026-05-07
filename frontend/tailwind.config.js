/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        japanese: ['"Noto Sans JP"', 'sans-serif'],
      },
      animation: {
        'flip-in': 'flipIn 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
