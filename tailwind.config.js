/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      animation: {
        'bounce-slight': 'bounceSlight 1s infinite alternate',
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'wobble': 'wobble 0.6s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'shake': 'shake 0.35s ease-in-out infinite',
        'pop-in': 'popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        bounceSlight: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wobble: {
          '0%, 100%': { transform: 'rotate(-4deg)' },
          '50%': { transform: 'rotate(4deg)' },
        },
        shimmer: {
          '0%': { opacity: '0.4' },
          '50%': { opacity: '1' },
          '100%': { opacity: '0.4' },
        },
        shake: {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(-2px, 1px) rotate(-1deg)' },
          '50%': { transform: 'translate(2px, -1px) rotate(1deg)' },
          '75%': { transform: 'translate(-1px, -2px) rotate(-0.5deg)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.88)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 16px rgba(245, 158, 11, 0.35)' },
          '50%': { boxShadow: '0 0 32px rgba(245, 158, 11, 0.7)' },
        },
      }
    },
  },
  plugins: [],
}
