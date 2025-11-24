import type { Metadata } from 'next'

import React from 'react'
import Script from 'next/script'
import { Roboto, Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'

import config from '@/config'
import { ConsentContent } from '@/components/consent.content'
import { ConsentModal } from '@/components/consent.modal'

import '@/styles/global.css'

import { cookies } from 'next/headers'

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-roboto',
  weight: ['300', '400', '500'],
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Davna | App',
  description: 'Aprenda outro idioma com Davna AI',
}

const RootLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode
}>) => {
  const cookie = await cookies().then(
    c => c.get(config.gtm.consent.cookieName)?.value,
  )

  let consent = 'denied'

  if (cookie && cookie === 'accepted') consent = 'granted'

  return (
    <html lang="pt-BR">
      <head>
        {/*<!-- GTM Consent -->*/}
        <Script id="gtm-consent" strategy="beforeInteractive">
          {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){ dataLayer.push(arguments); }

          gtag('consent', 'default', {
            'ad_user_data': '${consent}',
            'ad_personalization': '${consent}',
            'ad_storage': '${consent}',
            'analytics_storage': '${consent}',
          });
        `}
        </Script>
        {/*<!-- GTM Consent -->*/}
        {/*<!-- Google Tag Manager -->*/}
        <Script id="gtm" strategy="afterInteractive">
          {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-${config.gtm.id}');
        `}
        </Script>
        {/*<!-- End Google Tag Manager -->*/}
      </head>
      <body
        className={mergeNames(
          `bg-[#080808] text-white w-screen h-<1> min-h-screen`,
          roboto.variable,
          inter.variable,
        )}
      >
        {/*<!-- Google Tag Manager (noscript) -->*/}
        <noscript>
          <iframe
            className="hidden invisible"
            src={`https://www.googletagmanager.com/ns.html?id=GTM-${config.gtm.id}`}
            height="0"
            width="0"
          ></iframe>
        </noscript>
        {/*<!-- End Google Tag Manager (noscript) -->*/}
        {children}
        <ConsentModal>
          <ConsentContent />
        </ConsentModal>
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout

function mergeNames(...names: (string | undefined | false)[]): string {
  return names.filter(Boolean).join(' ')
}
