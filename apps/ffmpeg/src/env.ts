import type { AudioMetadataProvider } from './audio.metadata.provider'
import { getDuration } from './get.duration'

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
  providers: {
    audioMetadata: AudioMetadataProvider
  }
}

export const Env = (): Env => ({
  providers: {
    audioMetadata: {
      getDuration: getDuration(),
    },
  },
  config: {
    auth: {
      apiKey: {
        headerName: process.env.API_KEY_HEADER_NAME || 'x-api-key',
        key: process.env.API_ACCESS_TOKEN || 'default_access_token',
      },
    },
  },
})
