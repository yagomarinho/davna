import { handlerPipe } from '@davna/applications'
import { Route } from '@davna/core'
import { apiKeyAuthorization } from '@davna/middlewares'

import { healthCheckHandler } from '@davna/health'
import { Env } from './env'
import { getAudioMetadataHandler } from '../handlers/get.audio.metadata.handler'
import { convertAudioToAACtaHandler } from '../handlers/convert.audio.to.aac.handler'

export function getRoutes({ env }: { env: Env }) {
  return [
    Route({
      method: 'post',
      path: '/metadata',
      handler: handlerPipe(apiKeyAuthorization as any, getAudioMetadataHandler),
      env: {
        audioMetadata: env.providers.audioMetadata,
        config: env.config,
      },
    }),
    Route({
      method: 'post',
      path: '/convert',
      handler: handlerPipe(
        apiKeyAuthorization as any,
        convertAudioToAACtaHandler,
      ),
      env: {
        audioMetadata: env.providers.audioMetadata,
        config: env.config,
      },
    }),
    Route({
      path: '/health',
      handler: healthCheckHandler,
    }),
  ]
}
