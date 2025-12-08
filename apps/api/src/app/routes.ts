import { Route } from '@davna/core'
import { handlerPipe } from '@davna/applications'
import { apiKeyAuthorization, guardian } from '@davna/middlewares'

import {
  ensureAuthenticated,
  loginValidation,
  loginWithCredentialsHandler,
  refreshSessionHandler,
  refreshValidation,
  revokeSessionHandler,
  verifySessionHandler,
  verifyValidation,
} from '@davna/account'
import {
  createClassroomHandler,
  downloadAudioHandler,
  downloadValidation,
  uploadAudioHandler,
  uploadValidation,
} from '@davna/classroom'
import { healthCheckHandler } from '@davna/health'
import {
  appendLeadHandler,
  appendSuggestionHandler,
  leadValidate,
  suggestionValidate,
} from '@davna/feedback'

import { Env } from './env'

export const routes = ({
  repositories: {
    accounts,
    audios,
    classrooms,
    leads,
    messages,
    sessions,
    suggestions,
  },
  providers: { auth, signer, multimedia, storage },
  constants: { config },
}: Env): Route[] => [
  Route({
    method: 'post',
    path: '/feedback/lead',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      guardian as any,
      appendLeadHandler,
    ),
    env: {
      leads,
      config,
      validate: leadValidate,
    },
  }),
  Route({
    method: 'post',
    path: '/feedback/suggestion',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      ensureAuthenticated as any,
      guardian as any,
      appendSuggestionHandler,
    ),
    env: {
      auth,
      signer,
      sessions,
      accounts,
      suggestions,
      config,
      validate: suggestionValidate,
    },
  }),
  Route({
    path: '/session',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      guardian as any,
      verifySessionHandler,
    ),
    env: {
      sessions,
      signer,
      config,
      validate: verifyValidation({
        tokenHeader: config.auth.jwt.token.headerName,
      }),
    },
  }),
  Route({
    path: '/session/refresh',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      guardian as any,
      refreshSessionHandler,
    ),
    env: {
      sessions,
      signer,
      config,
      validate: refreshValidation({
        refreshTokenHeader: config.auth.jwt.refresh_token.headerName,
      }),
    },
  }),
  Route({
    method: 'post',
    path: '/session',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      guardian as any,
      loginWithCredentialsHandler,
    ),
    env: {
      accounts,
      sessions,
      auth,
      signer,
      config,
      validate: loginValidation,
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
      auth,
      config,
    },
  }),
  Route({
    path: '/audio/:id',
    handler: handlerPipe(
      guardian as any,
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
      config,
      validate: downloadValidation,
    },
  }),
  Route({
    method: 'post',
    path: '/audio',
    handler: handlerPipe(
      guardian as any,
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
      config,
      multimedia,
      validate: uploadValidation,
      storage_driver: config.providers.storage.default_driver,
    },
  }),
  Route({
    method: 'post',
    path: '/classroom',
    handler: handlerPipe(
      apiKeyAuthorization as any,
      ensureAuthenticated as any,
      createClassroomHandler,
    ),
    env: {
      accounts,
      sessions,
      signer,
      config,
      classrooms,
      messages,
    },
  }),
  Route({
    path: '/health',
    handler: healthCheckHandler,
  }),
]
