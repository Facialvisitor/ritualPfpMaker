/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ritual: {
          bg: '#000000',
          bg2: '#0A0A0A',
          card: '#111111',
          border: '#27272A',
          muted: '#A1A1AA',
        }
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
