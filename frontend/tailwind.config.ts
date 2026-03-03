import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest:  '#1B4332',
        moss:    '#2D6A4F',
        sage:    '#52B788',
        mint:    '#B7E4C7',
        pale:    '#D8F3DC',
        cream:   '#F5F0E8',
        paper:   '#FDFAF5',
        ink:     '#1A1A18',
        mist:    '#7A9080',
        border:  '#E0EAE2',
        warn:    '#D64E2A',
        gold:    '#D4A017',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        sans:    ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-dm-mono)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '9px',
      },
    },
  },
  plugins: [],
};

export default config;
