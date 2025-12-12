import type { Metadata } from 'next'

import React from 'react'
import Script from 'next/script'
import { cookies } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'

import { grotesk, roboto, sora } from '@/shared/fonts'
import { ConsentContent, ConsentModal } from '@/modules/feedback'

import '@/shared/styles/global.css'
import { mergeNames } from '@/shared/utils/merge.names'
import { clientConfig as config } from '@/config/client'
import { ToastManager } from '@/shared/contexts/toast.manager'

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
          `bg-[#080808] text-white w-screen min-w-[100vw] h-full min-h-[vh]`,
          roboto.variable,
          sora.variable,
          grotesk.variable,
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
        <ToastManager>{children}</ToastManager>
        <ConsentModal>
          <ConsentContent />
        </ConsentModal>
        <Analytics />
      </body>
    </html>
  )
}

export default RootLayout
