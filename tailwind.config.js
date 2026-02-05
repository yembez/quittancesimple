/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Palette principale unifiée
        'primary': '#ed7862',           // Corail - CTA principaux
        'secondary': '#2D3436',         // Gris anthracite - CTA secondaires
        'text-primary': '#1a1f20',      // Noir doux - Titres
        'text-secondary': '#545454',    // Gris moyen - Textes secondaires
        'background-light': '#fefdf9',  // Crème léger - Sections

        // Ancienne palette (deprecated - à retirer progressivement)
        'background-dark': '#101c22',
        'text-light': '#101c22',
        'text-dark': '#f6f7f8',
        'accent-light': '#4DB6AC',
        'accent-dark': '#4DB6AC',
        'subtle-light': '#e5e7eb',
        'subtle-dark': '#1f2937',
        'muted-light': '#6b7280',
        'muted-dark': '#9ca3af',

        // Couleurs identitaires
        'coral': '#ED7862',
        'charcoal': '#2D3436',
        'green-dynamic': '#4CAF50',

        // Gradient signature (pour accents visuels)
        'grad-from': '#FFD76F',     // Jaune vif
        'grad-mid': '#FF7A7F',      // Rose corail
        'grad-to': '#A46BFF',       // Violet vibrant
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 4s infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #0ea5e9, 0 0 10px #0ea5e9, 0 0 15px #0ea5e9' },
          '100%': { boxShadow: '0 0 10px #0ea5e9, 0 0 20px #0ea5e9, 0 0 30px #0ea5e9' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
};