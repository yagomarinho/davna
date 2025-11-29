export type Config = {
  auth: {
    apiKey: {
      headerName: string
      key: string
    }
  }
}

export type Env = {
  config: Config
}

export const Env = (): Env => ({
  config: {
    auth: {
      apiKey: {
        headerName: process.env.API_KEY_HEADER_NAME || 'x-api-key',
        key: process.env.API_ACCESS_TOKEN || 'default_access_token',
      },
    },
  },
})
