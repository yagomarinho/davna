export default {
  api: {
    baseUrl: process.env.API_BASE_URL,
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
