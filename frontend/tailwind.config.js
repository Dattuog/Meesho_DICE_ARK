module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'meesho-orange': '#FF6B35',
        'meesho-green': '#4CAF50',
        'meesho-blue': '#2196F3',
        'meesho-purple': '#9C27B0',
        'meesho-pink': '#E91E63',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}