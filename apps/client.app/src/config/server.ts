/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

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
