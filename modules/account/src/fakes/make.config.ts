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
