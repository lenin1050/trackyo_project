/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        themeBg: "var(--background)",
        themeCard: "var(--card-bg)",
        themeBorder: "var(--card-border)",
        themeText: "var(--text-primary)",
        themeTextMuted: "var(--text-secondary)",
        themePrimary: "var(--primary-accent)",
        themePrimaryHover: "var(--primary-hover)",
        themeAccent: "var(--accent-color)",
        themeShadow: "var(--shadow-color)",
      },
      boxShadow: {
        'glass': '0 8px 32px 0 var(--shadow-color)',
        'neon-glow': '0 0 15px var(--primary-accent), 0 0 5px var(--accent-color)',
        'neon-border': 'inset 0 0 8px var(--primary-accent)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
