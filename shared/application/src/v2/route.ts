/*
 * Copyright (c) 2025 Yago Marinho (Davna)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const routes = [
  HttpRoute({
    path: '/',
    method: 'post',
    guardian: request => {
      /* request validation and return modular request */
    },
    middleware: request => env => {
      /* some middleware */
    },
    handler: request => env => {
      /* some handler */
    },
    postprocessor: response => env => {
      /* some postprocessor */
    },
    onError: err => {
      /* some error handler */
    },
    env: {},
  }),
  WsRoute({
    path: '/classroom',
    events: [
      WsCommandRoute({
        inputEvent: 'classroom:welcome',
        outputEvent: 'classroom:started',
        handler: request => env => {
          /* some handler */
        },
        env: {},
      }),
      WsEventRoute({
        inputEvent: 'classroom:append-message',
        handler: request => env => {
          /* some handler */
        },
        env: {},
      }),
      MixedEventRoute({
        input: {
          source: 'emitter',
          event: 'domain:append-message',
        },
        output: {
          target: 'ws',
          event: 'append-message',
        },
        handler: request => env => {
          /* some handler */
        },
        env: {},
      }),
    ],
  }),
]

const app = Application({
  emitter: Emitter({ driver: Emitter.FirebaseDriver() }),
  port: 3333,
  upgrade: true,
  env: Env(),
  routes,
  app: {
    server: createNest(),
    adapter: nestAdapter(),
  },
})
