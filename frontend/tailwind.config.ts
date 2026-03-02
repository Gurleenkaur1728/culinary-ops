import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fef3ee',
          100: '#fde4d3',
          500: '#e8733a',
          600: '#d45f25',
          700: '#b04d1e',
        },
      },
    },
  },
  plugins: [],
};

export default config;
