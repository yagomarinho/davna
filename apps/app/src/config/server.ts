export const serverConfig = {
  api: {
    baseUrl: process.env.API_BASE_URL,
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
