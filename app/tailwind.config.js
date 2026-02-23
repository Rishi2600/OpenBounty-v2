/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original Solana colors (kept for compatibility)
        'solana-purple': '#9945FF',
        'solana-green': '#14F195',
        // New OpenBounty color palette
        'brown-deepest': '#1A100A',
        'brown-dark': '#2C1A0F',
        'brown-medium': '#3D2814',
        'ochre': '#C8860A',
        'ochre-light': '#E8A020',
        'offwhite': '#F5EFE6',
        'offwhite-dark': '#E8E0D5',
        // Legacy dark colors (mapped to new palette)
        'dark-bg': '#1A100A',
        'dark-card': '#2C1A0F',
        'dark-border': '#3D2814',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['DM Sans', 'system-ui', 'sans-serif'],
        'display': ['DM Serif Display', 'Georgia', 'serif'],
        'heading': ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-ochre': 'linear-gradient(135deg, #C8860A, #E8A020)',
      },
    },
  },
  plugins: [],
}
