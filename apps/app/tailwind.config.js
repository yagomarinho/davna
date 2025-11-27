/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        roboto: ['var(--font-roboto)', 'sans-serif'],
        sora: ['var(--font-sora)', 'sans-serif'],
        grotesk: ['var(--font-grotesk)', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
