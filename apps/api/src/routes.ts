import { apiKeyAuthorization } from './shared/middlewares/api.key.authorization'

import { handlerPipe } from './shared/helpers/handler.pipe'
import { Route } from './shared/core/route'

import { loginWithCredentialsHandler } from '../../../modules/account/src/handlers/login.with.credentials.handler'
import { Env } from './env'
import { verifySessionHandler } from '../../../modules/account/src/handlers/verify.session.handler'
import { refreshSessionHandler } from '../../../modules/account/src/handlers/refresh.session.handler'
import { ensureAuthenticated } from './shared/middlewares/ensure.authenticated'
import { revokeSessionHandler } from '../../../modules/account/src/handlers/revoke.session.handler'
import { uploadAudioHandler } from '../../../modules/classroom/src/handlers/upload.audio.handler'
import { downloadAudioHandler } from '../../../modules/classroom/src/handlers/download.audio.handler'
import { appendLeadHandler } from '../../../modules/lead/src/handlers/append.lead.handler'

export const routes = ({
  repositories: { accounts, leads, audios, sessions },
  providers: { auth, signer, storage },
}: Env): Route[] => [
  Route({
    method: 'post',
    path: '/lead',
    handler: handlerPipe(apiKeyAuthorization, appendLeadHandler),
    env: {
      leads,
    },
  }),
  Route({
    path: '/session',
    handler: handlerPipe(apiKeyAuthorization, verifySessionHandler),
    env: {
      sessions,
      signer,
    },
  }),
  Route({
    path: '/session/refresh',
    handler: handlerPipe(apiKeyAuthorization, refreshSessionHandler),
    env: {
      sessions,
      signer,
    },
  }),
  Route({
    method: 'post',
    path: '/session',
    handler: handlerPipe(apiKeyAuthorization, loginWithCredentialsHandler),
    env: {
      accounts,
      sessions,
      auth,
      signer,
    },
  }),
  Route({
    method: 'delete',
    path: '/session',
    handler: handlerPipe(
      apiKeyAuthorization,
      ensureAuthenticated,
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
      apiKeyAuthorization,
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
      apiKeyAuthorization,
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
