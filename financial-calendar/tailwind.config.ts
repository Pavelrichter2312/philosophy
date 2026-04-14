import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['DM Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          muted: '#6b6b6b',
          faint: '#b0b0b0',
        },
        surface: {
          DEFAULT: '#ffffff',
          raised: '#f7f7f5',
        },
        border: '#e8e8e4',
        positive: '#1a5c2e',
        negative: '#7a1818',
      },
      maxWidth: {
        grid: '1120px',
      },
      fontSize: {
        '2xs': '0.625rem',
      },
    },
  },
  plugins: [],
};
export default config;
