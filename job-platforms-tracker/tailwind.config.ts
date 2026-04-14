import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#111111',
          muted: '#555555',
          faint: '#999999',
        },
        surface: {
          DEFAULT: '#ffffff',
          raised: '#f9f9f9',
        },
        border: {
          DEFAULT: '#e5e5e5',
          strong: '#cccccc',
        },
        accent: '#1a1a2e',
        positive: '#16a34a',
        negative: '#dc2626',
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
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
