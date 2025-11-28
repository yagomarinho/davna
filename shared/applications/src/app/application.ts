import type { Server } from 'node:http'
import express from 'express'

import { Route } from '@davna/core'

import { expressHandlerAdapter } from './express.handler.adapter'

const DEFAULT_PORT = Number(process.env.PORT) || 3333

export interface Options {
  port?: number
  routes?: Route[]
}

export function Application({
  routes = [],
  port = DEFAULT_PORT,
}: Options = {}) {
  let server: Server
  const app = express()
  app.use(express.json())

  function mount() {
    routes.reduce(
      (acc, curr) =>
        acc[curr.method](
          curr.path,
          expressHandlerAdapter(curr.handler, curr.env ?? {}),
        ),
      app,
    )
  }

  function start(): Promise<void> {
    return new Promise((resolve, reject) => {
      server = app.listen(port, err => {
        if (err) return reject(err)
        return resolve()
      })
    })
  }

  function stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      server.close(err => {
        if (err) return reject(err)
        return resolve()
      })
    })
  }

  function exposeApp() {
    return app
  }

  return {
    mount,
    start,
    stop,
    exposeApp,
  }
}
