/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cobalt-blue': '#004aad',
        'verdigris': '#2f9c95',
        'verde-piaget': '#61CE70',
        'charcoal-blue': '#323e4e',
        'white-smoke': '#f5f5f5',
        'pale-slate': '#bbc4cc',
        'border-gray': '#e0e0e0',
        'hover-blue': '#0056c7',
      },
      fontFamily: {
        'serif': ['Rasa', 'serif'],
        'sans': ['Montserrat', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',    // 12px
        'sm': '0.875rem',   // 14px
        'base': '1rem',     // 16px
        'lg': '1.125rem',   // 18px
        'xl': '1.25rem',    // 20px
        '2xl': '1.5rem',    // 24px
        '3xl': '1.875rem',  // 30px
        '4xl': '2.25rem',   // 36px
        '5xl': '3rem',      // 48px
      },
      maxWidth: {
        'container': '1280px',
      },
      spacing: {
        'container-padding-mobile': '24px',
        'container-padding-desktop': '48px',
      },
    },
  },
  plugins: [],
}
