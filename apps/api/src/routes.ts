import { Route } from '@davna/core'
import { handlerPipe } from '@davna/applications'
import { apiKeyAuthorization } from '@davna/middlewares'

import {
  ensureAuthenticated,
  loginWithCredentialsHandler,
  refreshSessionHandler,
  revokeSessionHandler,
  verifySessionHandler,
} from '@davna/account'
import { downloadAudioHandler, uploadAudioHandler } from '@davna/classroom'
import { appendLeadHandler } from '@davna/lead'

import { Env } from './env'
import config from './config'

export const routes = ({
  repositories: { accounts, leads, audios, sessions },
  providers: { auth, signer, storage },
}: Env): Route[] => [
  Route({
    method: 'post',
    path: '/lead',
    handler: handlerPipe(apiKeyAuthorization as any, appendLeadHandler),
    env: {
      leads,
    },
  }),
  Route({
    path: '/session',
    handler: handlerPipe(apiKeyAuthorization as any, verifySessionHandler),
    env: {
      sessions,
      signer,
      config,
    },
  }),
  Route({
    path: '/session/refresh',
    handler: handlerPipe(apiKeyAuthorization as any, refreshSessionHandler),
    env: {
      sessions,
      signer,
      config,
    },
  }),
  Route({
    method: 'post',
    path: '/session',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      loginWithCredentialsHandler,
    ),
    env: {
      accounts,
      sessions,
      auth,
      signer,
      config,
    },
  }),
  Route({
    method: 'delete',
    path: '/session',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      ensureAuthenticated as any,
      revokeSessionHandler,
    ),
    env: {
      accounts,
      sessions,
      signer,
    },
  }),
  Route({
    path: '/audio/download/:id',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      ensureAuthenticated as any,
      downloadAudioHandler,
    ),
    env: {
      accounts,
      sessions,
      audios,
      signer,
      storage,
    },
  }),
  Route({
    method: 'post',
    path: '/audio/upload',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      ensureAuthenticated as any,
      uploadAudioHandler,
    ),
    env: {
      accounts,
      sessions,
      audios,
      signer,
      storage,
    },
  }),
]
