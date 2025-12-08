'use client'

import { PropsWithChildren, useEffect, useState } from 'react'
import { parseCookies, setCookie } from 'nookies'

import { Button } from '@/shared/components'
import { clientConfig as config } from '@/config'

enum CONSENT_STATUS {
  ACCEPTED = 'accepted',
  DENIED = 'denied',
}

export const ConsentModal = ({ children }: PropsWithChildren<{}>) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const cookies = parseCookies()
    const status = cookies[config.gtm.consent.cookieName]

    if (!status) {
      return setIsOpen(true)
    }

    setConsent(status)
  }, [])

  function setConsent(status: unknown) {
    if (status !== CONSENT_STATUS.ACCEPTED && status !== CONSENT_STATUS.DENIED)
      throw new Error('Invalid Consent Status')

    const updates = {
      [CONSENT_STATUS.ACCEPTED]: {
        ad_user_data: 'granted',
        ad_personalization: 'granted',
        ad_storage: 'granted',
        analytics_storage: 'granted',
      },
      [CONSENT_STATUS.DENIED]: {
        ad_user_data: 'denied',
        ad_personalization: 'denied',
        ad_storage: 'denied',
        analytics_storage: 'denied',
      },
    }

    const u = updates[status]

    window.gtag?.('consent', 'update', u)

    setCookie(null, config.gtm.consent.cookieName, status, {
      path: '/',
      expires: new Date('2099-12-31'),
      sameSite: 'lax',
    })

    setIsOpen(false)
  }

  return isOpen ? (
    <div className="fixed bottom-0 left-0 flex justify-center items-center p-8 w-full bg-[#2C2C2C]">
      <div className="flex flex-col justify-center items-center gap-8 w-full max-w-screen-md">
        {children}
        <div className="flex flex-row justify-end items-center gap-3 w-full">
          <Button
            type="secondary"
            onClick={() => setConsent(CONSENT_STATUS.DENIED)}
          >
            Rejeitar
          </Button>
          <Button
            type="primary"
            onClick={() => setConsent(CONSENT_STATUS.ACCEPTED)}
          >
            Aceitar
          </Button>
        </div>
      </div>
    </div>
  ) : null
}
