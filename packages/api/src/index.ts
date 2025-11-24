import 'dotenv/config'

import http from 'node:http'

import { Application } from './shared/app/application'

import { routes } from './routes'

import { Env } from './env'
import { createWsServer } from './shared/helpers/create.ws.server'

Env().then(env => {
  const PORT = process.env.PORT || 3333

  const app = Application({ routes: routes(env) })
  const server = createWsServer(http.createServer(app.exposeApp()), env)

  // eslint-disable-next-line no-console
  server.listen(PORT, () => console.log(`Server Ws+Http Start Running...`))
})
