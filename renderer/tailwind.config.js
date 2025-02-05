const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    './renderer/pages/**/*.{js,ts,jsx,tsx}',
    './renderer/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        pulse: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'text-fade-in': 'textFadeIn 0.6s ease-out forwards',
        fadeInOut: "fadeInOut 1.5s ease-in-out forwards",
        spinMedium: "spin 1s linear infinite",
        'spin-medium': 'spin 1.5s linear infinite',
      },
      backgroundImage: {
        'circuit-pattern': "url('/images/circuit-pattern.svg')",
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        textFadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInOut: {
          '0%':   { opacity: 0 },
          '25%':  { opacity: 1 },
          '75%':  { opacity: 1 },
          '100%': { opacity: 0 },
        },
      }
    },
  },
  plugins: [],
}
