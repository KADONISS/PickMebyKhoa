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
        'wobble': 'wobble 0.6s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
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
        }
      }
    },
  },
  plugins: [],
}
