/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export const clientConfig = {
  api: {
    wsBaseUrl: process.env.NEXT_PUBLIC_WS_BASE_URL,
  },
  gtm: {
    id: process.env.NEXT_PUBLIC_GTM_ID,
    consent: {
      cookieName: 'gtm_consent_status',
    },
  },
  session: {
    token: {
      cookieName: 'session_token',
    },
    refresh_token: {
      cookieName: 'session_refresh_token',
    },
  },
}
