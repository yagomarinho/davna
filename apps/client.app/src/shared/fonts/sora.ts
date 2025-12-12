import { Sora as FontSora } from 'next/font/google'

export const sora = FontSora({
  subsets: ['latin'],
  variable: '--font-sora',
  weight: ['400', '500', '700'],
})
