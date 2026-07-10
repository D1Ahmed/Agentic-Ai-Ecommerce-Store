import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    // Add this if you have a src folder, though you shouldn't right now
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'great-vibes': ['var(--font-great-vibes)'],
        'playfair': ['var(--font-playfair)'],
      },
      keyframes: {
        'blur-fade-in': {
          '0%': { opacity: '0', filter: 'blur(12px)', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', filter: 'blur(0)', transform: 'translateY(0) scale(1)' },
        }
      },
      animation: {
        'blur-fade-in': 'blur-fade-in 1.5s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      }
    },
  },
  plugins: [],
};
export default config;
