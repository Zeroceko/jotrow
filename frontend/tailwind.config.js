/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        retro: {
          bg: '#0c0c0c',
          panel: '#1a1a1a',
          border: '#333333',
          text: '#e0e0e0',
          muted: '#888888',
          accent: '#10b981', // emerald-500
          danger: '#ef4444', 
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'solid': '4px 4px 0 0 rgba(255, 255, 255, 0.15)',
        'solid-hover': '2px 2px 0 0 rgba(255, 255, 255, 0.15)',
        'solid-active': '0px 0px 0 0 rgba(255, 255, 255, 0.15)',
        'solid-accent': '4px 4px 0 0 rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [],
}
