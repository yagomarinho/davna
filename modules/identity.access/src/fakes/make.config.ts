/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ConfigDTO } from '../dtos/config'

export function makeConfig(): ConfigDTO {
  return {
    auth: {
      jwt: {
        token: {
          expiresIn: 60 * 60 * 1000,
          headerName: 'authorization',
        },
        refresh_token: {
          expiresIn: 5 * 24 * 60 * 60 * 1000,
          headerName: 'x-refresh-authorization',
        },
      },
    },
  }
}
