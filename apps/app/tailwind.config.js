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
      boxShadow: {
        'top-banner': `
          0 4px 20px rgba(0,0,0,0.5),
          inset 4px 4px 8px rgba(255,255,255,0.06),
          inset -2px -2px 8px rgba(255,255,255,0.06)
        `,
      },
    },
  },
  plugins: [],
}
