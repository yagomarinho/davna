import { handlerPipe } from '@davna/applications'
import { Route } from '@davna/core'
import { apiKeyAuthorization } from '@davna/middlewares'
import { getDurationHandler } from './get.audio.duration'
import { healthCheckHandler } from '@davna/health'
import { Env } from './env'

export function getRoutes({ env }: { env: Env }) {
  return [
    Route({
      method: 'post',
      path: '/',
      handler: handlerPipe(apiKeyAuthorization as any, getDurationHandler),
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
